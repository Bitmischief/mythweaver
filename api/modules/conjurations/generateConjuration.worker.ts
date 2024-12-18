import Queue, { Job } from 'bull';
import { Generator, getGenerator } from '@/data/conjurers';
import { BillingPlan, ConjurationVisibility } from '@prisma/client';
import { AppError, ErrorType, HttpCode } from '@/lib/errors/AppError';
import { sanitizeJson, trimPlural } from '@/lib/utils';
import { prisma } from '@/lib/providers/prisma';
import { MythWeaverLogger } from '@/lib/logger';
import { nanoid } from 'nanoid';
import { getCampaign } from '@/dataAccess/campaigns';
import { config } from '@/modules/core/workers/worker.config';
import {
  WebSocketEvent,
  WebSocketProvider,
} from '@/providers/websocketProvider';
import { defaultLLMProvider as llmProvider } from '@/providers/llmProvider';
import retry from 'async-await-retry';

export interface ConjureEvent {
  userId: number;
  conjurationRequestId: number;
  campaignId: number;
  generatorCode: string;
  arg?: string;
  type?: string;
}

export const conjureQueue = new Queue<ConjureEvent>('conjuring', config, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export class ConjurationWorker {
  constructor(
    private readonly logger: MythWeaverLogger,
    private readonly webSocketProvider: WebSocketProvider,
  ) {}

  async initializeWorker(): Promise<void> {
    conjureQueue.process(async (job: Job<ConjureEvent>) => {
      this.logger.info('Processing conjure job', {
        jobId: job.id,
        attempt: job.attemptsMade + 1,
        data: job.data,
      });

      await this.conjure(job.data);

      this.logger.info('Completed processing conjure job', {
        jobId: job.id,
        data: job.data,
      });
    });

    conjureQueue.on('failed', async (job: Job<ConjureEvent>, err: Error) => {
      this.logger.error(
        'Conjuration job failed permanently',
        {
          jobId: job.id,
          attempts: job.attemptsMade,
          maxAttempts: job.opts.attempts,
          data: job.data,
        },
        err,
      );

      await this.webSocketProvider.sendMessage(
        job.data.userId,
        WebSocketEvent.ConjurationError,
        {
          description: 'Failed to generate conjuration',
          errorCode: ErrorType.ConjurationError,
        },
      );
    });

    this.logger.info('Conjuration worker initialized successfully');
  }

  async addJob(data: ConjureEvent): Promise<Job<ConjureEvent>> {
    return conjureQueue.add(data);
  }

  private async conjure(request: ConjureEvent) {
    const generator = getGenerator(request.generatorCode);

    if (!generator) {
      throw new AppError({
        description: 'Generator not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const prompt = await this.buildPrompt(
      generator,
      request.campaignId,
      request.arg,
    );

    let generatedJson = '';

    const conjuration = await retry(async () => {
      generatedJson = await llmProvider.generateText(
        request.campaignId,
        prompt,
      );

      this.logger.info('Received json from llm provider', { generatedJson });

      const conjurationString = sanitizeJson(generatedJson);
      this.logger.info('Sanitized json from llm provider...', {
        conjurationString,
      });

      return JSON.parse(conjurationString || '');
    });

    const editorJsFormattedData = this.formatDataForEditorJs(
      conjuration,
      generator,
    );

    const user = await prisma.user.findUnique({
      where: {
        id: request.userId,
      },
    });

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const createdConjuration = await prisma.conjuration.create({
      data: {
        name: conjuration.name,
        userId: request.userId,
        visibility:
          user.plan === BillingPlan.FREE || user.plan === BillingPlan.TRIAL
            ? ConjurationVisibility.PUBLIC
            : ConjurationVisibility.PRIVATE,
        data: editorJsFormattedData,
        imageUri: conjuration.imageUri,
        conjurerCode: generator.code || '',
        tags: [
          generator.code,
          ...(conjuration.tags
            ? conjuration.tags.map((t: string) => t.toLowerCase())
            : []),
        ],
        conjurationRequestId: request.conjurationRequestId,
        prompt: request.arg,
        saves: {
          create: {
            userId: request.userId,
          },
        },
      },
    });

    const campaignCollection = await prisma.collections.findFirst({
      where: {
        campaignId: request.campaignId,
        parentCollectionId: null,
      },
    });

    if (campaignCollection) {
      await prisma.collectionConjuration.create({
        data: {
          collectionId: campaignCollection.id,
          conjurationId: createdConjuration.id,
        },
      });
    }

    if (createdConjuration.conjurerCode === 'players') {
      await prisma.campaignConjuration.create({
        data: {
          conjurationId: createdConjuration.id,
          campaignId: request.campaignId,
        },
      });
    }

    await this.webSocketProvider.sendMessage(
      request.userId,
      WebSocketEvent.ConjurationCreated,
      createdConjuration,
    );
  }

  private formatDataForEditorJs(conjuration: any, generator: any) {
    const conjurationCopy = { ...conjuration };

    delete conjurationCopy.name;
    delete conjurationCopy.imageAIPrompt;
    delete conjurationCopy.imageUri;
    delete conjurationCopy.tags;

    return {
      time: new Date().getTime(),
      blocks: Object.keys(conjurationCopy).map((key) => {
        const keyCapitalized = key.charAt(0).toUpperCase() + key.slice(1);
        const label =
          keyCapitalized.match(/($[a-z])|[A-Z][^A-Z]+/g)?.join(' ') ||
          keyCapitalized;
        const genCapitalized =
          generator.name.charAt(0).toUpperCase() + generator.name.slice(1);
        return {
          id: nanoid(10),
          data: {
            text: conjurationCopy[key],
            label: label,
            prompt: `${label} for this ${genCapitalized}`,
          },
          type: 'generationBlock',
        };
      }),
      version: '2.29.1',
    };
  }

  private async buildPrompt(
    generator: Generator,
    campaignId: number,
    customArg?: string,
  ) {
    const campaign = await getCampaign(campaignId);

    let prompt = `Please help me flesh out an idea for a ${trimPlural(
      generator.name.toLowerCase(),
    )}`;

    prompt += ` to be used in a role-playing game of ${campaign?.rpgSystemCode || 'dungeons and dragons'}.`;

    if (customArg && customArg.length > 0) {
      prompt += `Use the following information to guide you: ${customArg} `;
    }

    prompt += `Using the info provided, generate a ${trimPlural(
      generator.name.toLowerCase(),
    )} with engaging, immersive and compelling attributes that incorporate this information.`;

    prompt += `Please return the result as a flat JSON object with the following keys: ${generator.formatPrompt}. Return plain text for each value. `;

    if (generator.basePromptExtraContext) {
      prompt += generator.basePromptExtraContext;
    }

    prompt += ` Please return me only JSON and no other text.`;

    this.logger.info('Built prompt', { prompt });

    return prompt;
  }
}
