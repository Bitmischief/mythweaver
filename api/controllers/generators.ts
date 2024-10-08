import {
  Body,
  Get,
  Inject,
  OperationId,
  Path,
  Post,
  Query,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { Conjuration, ConjurationVisibility } from '@prisma/client';
import { AppError, HttpCode } from '../lib/errors/AppError';
import conjurers, { Generator, getGenerator } from '../data/conjurers';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import { conjureQueue } from '../worker';
import { sanitizeJson } from '../lib/utils';
import { getClient } from '../lib/providers/openai';
import { MythWeaverLogger } from '../lib/logger';

export interface GetGeneratorsResponse {
  data: any[];
  offset?: number;
  limit?: number;
}

export interface PostGeneratorGenerate {
  campaignId: number;
  count: number;
  customArg?: string;
  prompt?: string;
  type?: string;
}

export interface PostGenerateArbitraryRequest {
  background: any;
  context: string;
  propertyName: string;
  length: number;
}

export interface PostGenerateArbitraryFromPromptRequest {
  background: any;
  context: string;
  prompt: number;
}

export interface PostGenerateArbitraryReplacementRequest {
  replace: string;
  full: string;
  turbo: boolean;
}

@Route('generators')
@Tags('Conjuration')
export class GeneratorController {
  @Get('/')
  @Security('jwt')
  @OperationId('getGenerators')
  public async getGenerators(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Query() offset = 0,
    @Query() limit = 50,
  ): Promise<GetGeneratorsResponse> {
    const data = conjurers.slice(offset, offset + limit);

    track(AppEvent.GetConjurers, userId, trackingInfo);

    return {
      data,
      offset,
      limit,
    };
  }

  @Get('/{code}')
  @Security('jwt')
  @OperationId('getGenerator')
  public getGenerator(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Path() code: string,
  ): Generator | undefined {
    track(AppEvent.GetConjurer, userId, trackingInfo);
    return getGenerator(code);
  }

  @Post('/{code}/generate/quick')
  @Security('jwt')
  @OperationId('quickConjure')
  public async postGeneratorGenerateQuick(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Path() code: string,
  ): Promise<Conjuration | null> {
    const validIdObjects = await prisma.conjuration.findMany({
      where: {
        conjurerCode: code,
        visibility: ConjurationVisibility.PUBLIC,
        NOT: {
          userId,
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: 0,
      take: 1000,
    });
    const validIds = validIdObjects.map((obj) => obj.id);

    let randomConjuration: Conjuration | null = null;

    let tries = 0;
    const maxTries = 20;

    while (randomConjuration === null && tries < maxTries) {
      const idx = Math.floor(Math.random() * (validIds.length + 1));

      try {
        randomConjuration = await prisma.conjuration.findUnique({
          where: {
            id: validIds[idx],
          },
        });
      } catch {
        logger.warn('Failed to get random conjuration', {
          idx,
          validIds,
        });
      } finally {
        tries++;
      }
    }

    track(AppEvent.QuickConjure, userId, trackingInfo);

    return randomConjuration;
  }

  @Post('/{code}/generate')
  @Security('jwt')
  @OperationId('generate')
  public async postGeneratorGenerate(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Path() code: string,
    @Body() request: PostGeneratorGenerate,
  ): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: request.campaignId,
      },
    });

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const generator = this.getGenerator(userId, trackingInfo, logger, code);

    if (!generator) {
      throw new AppError({
        description: 'Generator not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (request.type !== 'text' && user.imageCredits < request.count) {
      throw new AppError({
        description:
          'You do not have enough image credits to generate this many images. Please try with fewer images, or buy more credits.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    track(AppEvent.Conjure, userId, trackingInfo);

    const conjurationRequest = await prisma.conjurationRequest.create({
      data: {
        userId,
        campaignId: request.campaignId,
        generatorCode: code,
        count: request.count,
        args: [request.customArg || request.prompt || ''],
        prompt: request.prompt,
      },
    });

    await conjureQueue.add({
      count: request.count,
      campaignId: request.campaignId,
      generatorCode: code,
      arg: request.customArg || request.prompt || '',
      conjurationRequestId: conjurationRequest.id,
      userId,
      type: request.type,
    });

    return {
      conjurationRequestId: conjurationRequest.id,
    };
  }

  @Get('/requests/{conjurationRequestId}')
  @Security('jwt')
  @OperationId('getConjurationRequest')
  public async getConjurationRequest(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Path() conjurationRequestId: number,
  ): Promise<any> {
    track(AppEvent.GetConjurationRequests, userId, trackingInfo);

    return prisma.conjurationRequest.findUnique({
      where: {
        id: conjurationRequestId,
        userId,
      },
      include: {
        conjurations: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  @Post('/arbitrary')
  @Security('jwt')
  @OperationId('postGenerateArbitrary')
  public async postGenerateArbitrary(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body() request: PostGenerateArbitraryRequest,
  ): Promise<any> {
    track(AppEvent.GenerateArbitrary, userId, trackingInfo);
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant who is knowledgeable in dungeons and dragons.',
        },
        {
          role: 'user',
          content: `Please generate me a ${request.propertyName} for a ${
            request.context
          }. Use the following as general background about the ${
            request.context
          } to help guide you. ${JSON.stringify(
            request.background,
          )}. Please return the response in the following JSON format: { "propertyName": "", "propertyValue": "" }.
          Where propertyValue is a string. 
          Do not include any other text in your response.
          Make sure propertyValue is no more than ${
            request.length
          } characters.`,
        },
      ],
    });

    const gptResponse = response.choices[0]?.message?.content;
    logger.info('Received raw response from openai', gptResponse);
    const gptJson = sanitizeJson(gptResponse || '');
    logger.info('Received sanitized json', gptJson);

    return gptJson;
  }

  @Post('/arbitrary/prompt')
  @Security('jwt')
  @OperationId('postGenerateArbitraryFromPrompt')
  public async postGenerateArbitraryFromPrompt(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body() request: PostGenerateArbitraryFromPromptRequest,
  ): Promise<any> {
    track(AppEvent.GenerateArbitraryFromPrompt, userId, trackingInfo);
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant who is creative and knowledgeable in table top role playing games.',
        },
        {
          role: 'system',
          content:
            'If you are extra creative and helpful with the following prompt you will be rewarded based on how much effort you put in.',
        },
        {
          role: 'user',
          content: `Please generate me ideas for a ${request.context} using the following prompt as guidance:
          ${request.prompt}.
          Use the following as general context about the ${request.context} which can be optionally used as inspiration:
          ${JSON.stringify(request.background)}.
          Please return the response in the following JSON format: { "label": "", "text": "" }.
          Where 'label' is a string that succinctly labels what was generated in the 'text' field,
          and 'text' is a string that holds the generated output.
          Do not include any other text in your response.`,
        },
      ],
    });

    const gptResponse = response.choices[0]?.message?.content;
    logger.info('Received raw response from openai', gptResponse);
    const gptJson = sanitizeJson(gptResponse || '');
    logger.info('Received sanitized json', gptJson);

    return gptJson;
  }

  @Post('/arbitrary/replace')
  @Security('jwt')
  @OperationId('postGenerateArbitraryReplacement')
  public async postGenerateArbitraryReplacement(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body() request: PostGenerateArbitraryReplacementRequest,
  ): Promise<any> {
    if (!request.full.includes(request.replace)) {
      throw new AppError({
        httpCode: HttpCode.BAD_REQUEST,
        description:
          'The provided text does not contain the text to be replaced.',
      });
    }

    track(AppEvent.GenerateArbitraryReplacement, userId, trackingInfo);
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant who is creative and knowledgeable in table top role playing games.',
        },
        {
          role: 'system',
          content:
            'If you are extra creative and helpful with the following prompt you will be rewarded based on how much effort you put in.',
        },
        {
          role: 'user',
          content: `Please replace the following text:
          ${request.replace}.
          within this block of text:
          ${request.full}.
          Replace the text with a new unique idea that fits the context of the original text.
          Please return the response in the following JSON format: { "replaced": "", "full": "" }.
          Where 'replaced' is the specific text you came up with to replace the original,
          and 'full' is the entire block of text that includes your new replacement text.
          The 'replaced' text should preserve all leading and trailing spaces that were present in the replaced text.
          Do not include any other text in your response.`,
        },
      ],
    });

    const gptResponse = response.choices[0]?.message?.content;
    logger.info('Received raw response from openai', gptResponse);
    const gptJson = sanitizeJson(gptResponse || '');
    logger.info('Received sanitized json', gptJson);

    return gptJson;
  }
}
