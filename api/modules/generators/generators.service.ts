import { Conjuration } from '@prisma/client';
import { AppError, HttpCode } from '@/modules/core/errors/AppError';
import {
  AppEvent,
  track,
  TrackingInfo,
} from '@/modules/core/analytics/tracking';
import { sanitizeJson } from '@/modules/core/utils/json';
import { Logger } from '@/modules/core/logging/logger';
import { GeneratorsDataProvider } from './generators.dataprovider';
import conjurers, { Generator, getGenerator } from '@/data/conjurers';
import {
  GetGeneratorsResponse,
  PostGeneratorGenerate,
  PostGenerateArbitraryRequest,
  PostGenerateArbitraryFromPromptRequest,
  PostGenerateArbitraryReplacementRequest,
} from '@/modules/generators/generators.interface';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';
import { CampaignDataProvider } from '@/modules/campaigns/campaign.dataprovider';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { LLMProvider } from '@/providers/llmProvider';

import { Queue } from 'bull';
import { ConjureEvent } from '@/modules/conjurations/workers/generateConjuration.worker';
export class GeneratorsService {
  constructor(
    private generatorsDataProvider: GeneratorsDataProvider,
    private conjurationsDataProvider: ConjurationsDataProvider,
    private campaignDataProvider: CampaignDataProvider,
    private usersDataProvider: UsersDataProvider,
    private logger: Logger,
    private conjureQueue: Queue<ConjureEvent>,
    private llmProvider: LLMProvider,
  ) {}

  async getGenerators(
    userId: number,
    trackingInfo: TrackingInfo,
    offset: number,
    limit: number,
  ): Promise<GetGeneratorsResponse> {
    const data = conjurers.slice(offset, offset + limit);
    track(AppEvent.GetConjurers, userId, trackingInfo);
    return { data, offset, limit };
  }

  getGenerator(
    userId: number,
    trackingInfo: TrackingInfo,
    code: string,
  ): Generator | undefined {
    track(AppEvent.GetConjurer, userId, trackingInfo);
    return getGenerator(code);
  }

  async quickConjure(
    userId: number,
    trackingInfo: TrackingInfo,
    code: string,
  ): Promise<Conjuration | null> {
    const validIdObjects =
      await this.conjurationsDataProvider.getQuickConjurations(code, userId);
    const validIds = validIdObjects.map((obj) => obj.id);

    let randomConjuration: Conjuration | null = null;
    let tries = 0;
    const maxTries = 20;

    while (randomConjuration === null && tries < maxTries) {
      const idx = Math.floor(Math.random() * (validIds.length + 1));
      try {
        randomConjuration =
          await this.conjurationsDataProvider.getConjurationById(validIds[idx]);
      } catch {
        this.logger.warn('Failed to get random conjuration', { idx, validIds });
      } finally {
        tries++;
      }
    }

    track(AppEvent.QuickConjure, userId, trackingInfo);
    return randomConjuration;
  }

  async generate(
    userId: number,
    trackingInfo: TrackingInfo,
    code: string,
    request: PostGeneratorGenerate,
  ): Promise<any> {
    const campaign = await this.campaignDataProvider.getUserCampaign(
      userId,
      request.campaignId,
    );
    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const generator = this.getGenerator(userId, trackingInfo, code);
    if (!generator) {
      throw new AppError({
        description: 'Generator not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const user = await this.usersDataProvider.getUserById(userId);
    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (request.type !== 'text' && user.imageCredits < request.count) {
      throw new AppError({
        description:
          'You do not have enough credits to generate this many images. Please try with fewer images, or buy more credits.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    track(AppEvent.Conjure, userId, trackingInfo);

    const conjurationRequest =
      await this.generatorsDataProvider.createConjurationRequest({
        userId,
        campaignId: request.campaignId,
        generatorCode: code,
        count: request.count,
        args: [request.customArg || request.prompt || ''],
        prompt: request.prompt,
      });

    await this.conjureQueue.add({
      campaignId: request.campaignId,
      generatorCode: code,
      arg: request.customArg || request.prompt || '',
      conjurationRequestId: conjurationRequest.id,
      userId,
      type: request.type,
    });

    return { conjurationRequestId: conjurationRequest.id };
  }

  async getConjurationRequest(
    userId: number,
    trackingInfo: TrackingInfo,
    conjurationRequestId: number,
  ): Promise<any> {
    track(AppEvent.GetConjurationRequests, userId, trackingInfo);
    return this.generatorsDataProvider.getConjurationRequest(
      userId,
      conjurationRequestId,
    );
  }

  async generateText(campaignId: number, prompt: string): Promise<string> {
    const response = await this.llmProvider.generateText(campaignId, prompt);

    this.logger.info('Received raw response from llm provider', response);
    const json = sanitizeJson(response || '');
    this.logger.info('Received sanitized json', json);

    return json;
  }

  async generateArbitrary(
    userId: number,
    trackingInfo: TrackingInfo,
    request: PostGenerateArbitraryRequest,
  ): Promise<any> {
    track(AppEvent.GenerateArbitrary, userId, trackingInfo);
    const prompt = `Please generate me a ${request.propertyName} for a ${request.context}. Use the following as general background about the ${request.context} to help guide you. ${JSON.stringify(request.background)}. Please return the response in the following JSON format: { "propertyName": "", "propertyValue": "" }.
          Where propertyValue is a string. 
          Do not include any other text in your response.
          Make sure propertyValue is no more than ${request.length} characters.`;

    return this.generateText(request.campaignId, prompt);
  }

  async generateArbitraryFromPrompt(
    userId: number,
    trackingInfo: TrackingInfo,
    request: PostGenerateArbitraryFromPromptRequest,
  ): Promise<any> {
    track(AppEvent.GenerateArbitraryFromPrompt, userId, trackingInfo);

    const prompt = `Please generate me ideas for a ${request.context} using the following prompt as guidance:
      ${request.prompt}.
      Use the following as general context about the ${request.context} which can be optionally used as inspiration:
      ${JSON.stringify(request.background)}.
      Please return the response in the following JSON format: { "label": "", "text": "" }.
      Where 'label' is a string that succinctly labels what was generated in the 'text' field,
      and 'text' is a string that holds the generated output.
      Do not include any other text in your response.`;

    return this.generateText(request.campaignId, prompt);
  }

  async generateArbitraryReplacement(
    userId: number,
    trackingInfo: TrackingInfo,
    request: PostGenerateArbitraryReplacementRequest,
  ): Promise<any> {
    if (!request.full.includes(request.replace)) {
      throw new AppError({
        httpCode: HttpCode.BAD_REQUEST,
        description:
          'The provided text does not contain the text to be replaced.',
      });
    }

    track(AppEvent.GenerateArbitraryReplacement, userId, trackingInfo);

    const prompt = `Please replace the following text:
      ${request.replace}.
      within this block of text:
      ${request.full}.
      Replace the text with a new unique idea that fits the context of the original text.
      Please return the response in the following JSON format: { "replaced": "", "full": "" }.
      Where 'replaced' is the specific text you came up with to replace the original,
      and 'full' is the entire block of text that includes your new replacement text.
      The 'replaced' text should preserve all leading and trailing spaces that were present in the replaced text.
      Do not include any other text in your response.`;

    return this.generateText(request.campaignId, prompt);
  }
}
