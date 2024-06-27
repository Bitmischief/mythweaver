import { Generator, getGenerator } from '../../data/conjurers';
import { BillingPlan, Campaign, ConjurationVisibility } from '@prisma/client';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { sanitizeJson, trimPlural } from '../../lib/utils';
import { generateImage } from '../../services/images/imageGeneration';
import { prisma } from '../../lib/providers/prisma';
import { ConjureEvent, processTagsQueue } from '../index';
import { getClient } from '../../lib/providers/openai';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';
import logger from '../../lib/logger';
import { sendConjurationCountUpdatedEvent } from '../../lib/planRestrictionHelpers';
import { nanoid } from 'nanoid';
import {
  getCampaign,
  getCampaignContextConfig,
} from '../../dataAccess/campaigns';
import { Message, TextContentBlock } from 'openai/resources/beta/threads';

const openai = getClient();

export const conjure = async (request: ConjureEvent) => {
  const generator = getGenerator(request.generatorCode);
  const type = request.type || 'image-text';

  if (!generator) {
    throw new AppError({
      description: 'Generator not found.',
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

  const campaign = await getCampaign(request.campaignId);

  if (!campaign) {
    throw new AppError({
      description: 'Campaign not found.',
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

  const contextConfig = await getCampaignContextConfig(request.campaignId);

  const prompt = buildPrompt(
    generator,
    campaign,
    request.arg,
    request.imagePrompt,
  );

  let conjuration: any = undefined;

  do {
    let response: Message | undefined;

    try {
      const thread = await openai.beta.threads.create();

      await openai.beta.threads.messages.create(thread.id, {
        content: prompt,
        role: 'assistant',
      });

      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: contextConfig.assistantId,
      });

      const messages = await openai.beta.threads.messages.list(thread.id, {
        run_id: run.id,
      });

      response = messages.data.pop();
    } catch (err: any) {
      logger.error(
        'Error generating character with openai',
        err.response?.data,
      );
    }

    if (!response) {
      throw new AppError({
        description: 'Error generating character.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    let generatedJson;
    try {
      generatedJson =
        (response.content[0] as TextContentBlock)?.text?.value || '';
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
      imageAIPrompt: request.imagePrompt || conjuration.imageAIPrompt,
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

  if (type === 'image-text') {
    await sendConjurationCountUpdatedEvent(request.userId);

    const imagePrompt = request.imagePrompt?.length
      ? request.imagePrompt
      : conjuration.imageAIPrompt;

    const images = await generateImage({
      userId: request.userId,
      prompt: imagePrompt,
      count: 1,
      negativePrompt: request.imageNegativePrompt,
      stylePreset: request.imageStylePreset,
      linking: {
        conjurationId: createdConjuration.id,
      },
      forceImagePrimary: true,
    });

    if (!images) {
      await prisma.conjuration.update({
        where: {
          id: createdConjuration.id,
        },
        data: {
          imageGenerationFailed: true,
        },
      });

      throw new AppError({
        description: 'Error generating image.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    conjuration.imageUri = images[0]?.uri;

    await prisma.conjuration.update({
      where: {
        id: createdConjuration.id,
      },
      data: {
        imageUri: conjuration.imageUri,
      },
    });

    await processTagsQueue.add({
      conjurationIds: [createdConjuration.id],
    });
  }
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

const buildPrompt = (
  generator: Generator,
  campaign?: Campaign | undefined,
  customArg?: string | undefined,
  imagePrompt?: string | undefined,
) => {
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
