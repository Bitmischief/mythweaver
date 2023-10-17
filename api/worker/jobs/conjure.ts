import { Generator, getGenerator } from '../../data/conjurers';
import { Campaign } from '@prisma/client';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { sanitizeJson, trimPlural } from '../../lib/utils';
import { generateImage } from '../../services/imageGeneration';
import { prisma } from '../../lib/providers/prisma';
import { ConjureEvent, processTagsQueue } from '../index';
import { getRpgSystem } from '../../data/rpgSystems';
import { getClient } from '../../lib/providers/openai';
import { parentLogger } from '../../lib/logger';

const logger = parentLogger.getSubLogger();
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
    !request.imagePrompt,
  );

  let conjuration: any = undefined;

  do {
    let response: any;

    try {
      response = await openai.completions.create({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 3000,
      });
    } catch (err: any) {
      logger.error('Error generating character with openai', err.response.data);
    }

    if (!response) {
      throw new AppError({
        description: 'Error generating character.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    const generatedJson = response.choices[0].text?.trim() || '';
    logger.info('Received json from openai', generatedJson);

    const conjurationString = sanitizeJson(generatedJson);
    logger.info('Sanitized json from openai...', conjurationString);

    try {
      conjuration = JSON.parse(conjurationString || '');
    } catch (e) {
      logger.warn('Failed to parse conjuration string', e, generatedJson);
    }
  } while (!conjuration || !conjuration?.imageAIPrompt);

  const createdConjuration = await prisma.conjuration.create({
    data: {
      name: conjuration.name,
      userId: request.userId,
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
    },
  });

  const imagePrompt = request.imagePrompt?.length
    ? request.imagePrompt
    : conjuration.imageAIPrompt;

  conjuration.imageUri = (
    await generateImage({
      userId: request.userId,
      prompt: imagePrompt,
      count: 1,
      negativePrompt: request.imageNegativePrompt,
      stylePreset: request.imageStylePreset,
      linking: {
        conjurationId: createdConjuration.id,
      },
    })
  )[0];

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
  generateImagePrompt = true,
) => {
  let prompt = `You are a master storyteller. Please generate me a unique ${trimPlural(
    generator.name.toLowerCase(),
  )}`;

  if (campaign) {
    const rpgSystem = getRpgSystem(campaign.rpgSystemCode);
    const publicAdventure = rpgSystem?.publicAdventures?.find(
      (a) => a.code === campaign.publicAdventureCode,
    );

    if (!rpgSystem) {
      throw new AppError({
        description: 'RPG System not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    prompt += ` to be used in ${rpgSystem.name}`;

    if (publicAdventure) {
      prompt += `for the campaign ${publicAdventure?.name}. `;
    } else {
      prompt += '. ';
    }
  } else {
    prompt += ' to be used in a roleplaying game like dungeons and dragons. ';
  }

  if (customArg && customArg.length > 0) {
    prompt += `I want ${customArg} `;
  }

  prompt += `Please focus on generating a distinctly unique and different ${trimPlural(
    generator.name.toLowerCase(),
  )} with really engaging, immersive and compelling attributes. Please return JSON only so that I can easily deserialize into a javascript object. Use the following format. ${
    generator.formatPrompt
  }. Please escape any double quotes in any JSON properties with a backslash.`;

  if (generator.allowsImageGeneration && generateImagePrompt) {
    prompt += `Please generate a prompt to be used by an AI image generator to generate an portrait image for this ${trimPlural(
      generator.name.toLowerCase(),
    )} to be stored in the JSON property 'imageAIPrompt'. ${
      generator.imagePromptExtraContext
    }. `;
  }

  if (generator.basePromptExtraContext) {
    prompt += generator.basePromptExtraContext;
  }

  logger.info('Built prompt', prompt);

  return prompt;
};
