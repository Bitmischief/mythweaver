import { Generator, getGenerator } from '../../data/conjurers';
import { BillingPlan, Campaign, ConjurationVisibility } from '@prisma/client';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { sanitizeJson, trimPlural } from '../../lib/utils';
import { generateImage } from '../../services/imageGeneration';
import { prisma } from '../../lib/providers/prisma';
import { ConjureEvent, processTagsQueue } from '../index';
import { getClient } from '../../lib/providers/openai';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';
import logger from '../../lib/logger';
import { sendConjurationCountUpdatedEvent } from '../../lib/planRestrictionHelpers';

const openai = getClient();

export const conjure = async (request: ConjureEvent) => {
  const generator = getGenerator(request.generatorCode);

  if (!generator) {
    throw new AppError({
      description: 'Generator not found.',
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

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

  const prompt = buildPrompt(
    generator,
    campaign,
    request.arg,
    request.imagePrompt,
  );

  let conjuration: any = undefined;

  do {
    let response: any;

    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant who is knowledgeable in tabletop roleplaying games.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
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
      generatedJson = response.choices[0]?.message?.content || '';
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

  const createdConjuration = await prisma.conjuration.create({
    data: {
      name: conjuration.name,
      userId: request.userId,
      visibility:
        user.plan === BillingPlan.FREE || user.plan === BillingPlan.TRIAL
          ? ConjurationVisibility.PUBLIC
          : ConjurationVisibility.PRIVATE,
      data: {
        ...conjuration,
        name: undefined,
        imageAIPrompt: undefined,
        imageUri: undefined,
        tags: undefined,
      },
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

  await sendConjurationCountUpdatedEvent(request.userId);

  const imagePrompt = request.imagePrompt?.length
    ? request.imagePrompt
    : conjuration.imageAIPrompt;

  const uris = await generateImage({
    userId: request.userId,
    prompt: imagePrompt,
    count: 1,
    negativePrompt: request.imageNegativePrompt,
    stylePreset: request.imageStylePreset,
    linking: {
      conjurationId: createdConjuration.id,
    },
  });

  if (!uris) {
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

  conjuration.imageUri = uris[0];

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
};

const buildPrompt = (
  generator: Generator,
  campaign?: Campaign | undefined,
  customArg?: string | undefined,
  imagePrompt?: string | undefined,
) => {
  let prompt = `You are a master storyteller. Please generate me a unique ${trimPlural(
    generator.name.toLowerCase(),
  )}`;

  if (campaign) {
    let rpgSystem = campaign.rpgSystemCode;
    if (!rpgSystem) {
      rpgSystem = 'a role-playing game like dungeons and dragons.';
    }
    prompt += ` to be used in a role-playing game like ${rpgSystem}`;
  } else {
    prompt += ' to be used in a role-playing game like dungeons and dragons. ';
  }

  if (customArg && customArg.length > 0) {
    prompt += `I want ${customArg} `;
  }

  prompt += `Please focus on generating a distinctly unique and different ${trimPlural(
    generator.name.toLowerCase(),
  )} with really engaging, immersive and compelling attributes. Please return JSON only so that I can easily deserialize into a javascript object. Use the following format. ${
    generator.formatPrompt
  }. Please escape any double quotes in any JSON properties with a backslash. `;

  if (generator.allowsImageGeneration && !imagePrompt) {
    prompt += `Please generate a prompt to be used by an AI image generator to generate an portrait image for this ${trimPlural(
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
