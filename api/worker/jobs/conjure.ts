import Queue from 'bull';
import { Generator, getGenerator } from '../../data/conjurers';
import { BillingPlan, ConjurationVisibility } from '@prisma/client';
import { AppError, ErrorType, HttpCode } from '../../lib/errors/AppError';
import { sanitizeJson, trimPlural } from '../../lib/utils';
import { prisma } from '../../lib/providers/prisma';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';
import logger from '../../lib/logger';
import { nanoid } from 'nanoid';
import { generateText } from '../../services/textGeneration';
import { getCampaign } from '../../dataAccess/campaigns';
import { config } from '../config';

export interface ConjureEvent {
  userId: number;
  conjurationRequestId: number;
  campaignId: number;
  generatorCode: string;
  count: number;
  arg?: string | undefined;
  type?: string;
}

export const conjureQueue = new Queue<ConjureEvent>('conjuring', config);

conjureQueue.process(async (job, done) => {
  logger.info('Processing conjure job', job.data);

  const jobPromises = [];

  for (let i = 0; i < job.data.count; i++) {
    const promise = conjure(job.data);
    jobPromises.push(promise);
  }

  try {
    await Promise.all(jobPromises);
    logger.info('Completed processing conjure job', job.data);
    done();
  } catch (err) {
    logger.error('Error processing conjure job!', err);

    done(
      new AppError({
        description:
          'There was an error generating your conjuration. Please try again.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        websocket: {
          userId: job.data.userId,
          errorCode: ErrorType.ConjurationError,
        },
      }),
    );
  }
});

export const conjure = async (request: ConjureEvent) => {
  const generator = getGenerator(request.generatorCode);
  const type = request.type || 'image-text';

  if (!generator) {
    throw new AppError({
      description: 'Generator not found.',
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

  const prompt = await buildPrompt(generator, request.campaignId, request.arg);

  let conjuration: any = undefined;
  let generatedJson = '';

  do {
    try {
      generatedJson = await generateText(request.campaignId, prompt);
    } catch (err: any) {
      logger.error(
        'Error generating character with openai',
        err.response?.data,
      );
    }

    try {
      logger.info('Received json from openai', { generatedJson });

      const conjurationString = sanitizeJson(generatedJson);
      logger.info('Sanitized json from openai...', { conjurationString });

      conjuration = JSON.parse(conjurationString || '');
    } catch (e) {
      logger.warn('Failed to parse conjuration string', {
        error: e,
        generatedJson,
      });
    }
  } while (!conjuration || !conjuration?.imageAIPrompt);

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

  const editorJsFormattedData = formatDataForEditorJs(conjuration, generator);
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
    },
  });

  await sendWebsocketMessage(
    request.userId,
    WebSocketEvent.ConjurationCreated,
    createdConjuration,
  );
};

const formatDataForEditorJs = (conjuration: any, generator: any) => {
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
};

const buildPrompt = async (
  generator: Generator,
  campaignId: number,
  customArg?: string | undefined,
  imagePrompt?: string | undefined,
) => {
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

  if (generator.allowsImageGeneration && !imagePrompt) {
    prompt += `Using the same information provided above, please generate a prompt to be used by an AI image generator to generate an portrait image for this ${trimPlural(
      generator.name.toLowerCase(),
    )} to be stored in the JSON property 'imageAIPrompt'. ${
      generator.imagePromptExtraContext
    }. `;
  } else if (imagePrompt) {
    prompt += `Please reference this image prompt I am using for the character portrait to further guide your generation: "${imagePrompt}". `;
  }

  if (generator.basePromptExtraContext) {
    prompt += generator.basePromptExtraContext;
  }

  prompt += ` Please return me only JSON and no other text.`;

  logger.info('Built prompt', { prompt });

  return prompt;
};
