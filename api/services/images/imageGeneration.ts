import { prisma } from '../../lib/providers/prisma';
import { sendWebsocketMessage, WebSocketEvent } from '../websockets';
import { generateStableDiffusionImage } from './stableDiffusionImageService';
import { GeneratedImage, ImageGenerationRequest } from './models';
import { Image, ImageCreditChangeType } from '@prisma/client';
import { generateMythWeaverModelImage } from './mythweaverImageService';
import { modifyImageCreditCount } from '../credits';
import { AppEvent, track } from '../../lib/tracking';
import { AppError, ErrorType, HttpCode } from '../../lib/errors/AppError';
import retry from 'async-await-retry';
import { checkImageStatusQueue } from '../../worker';
import { AxiosError } from 'axios';
import logger from '../../lib/logger';

export const generateImage = async (request: ImageGenerationRequest) => {
  const user = await prisma.user.findUnique({
    where: {
      id: request.userId,
    },
  });

  if (!user) {
    throw new AppError({
      description: 'User not found.',
      httpCode: HttpCode.BAD_REQUEST,
      websocket: {
        userId: request.userId,
        errorCode: ErrorType.ImageGenerationError,
        context: {
          ...request.linking,
        },
      },
    });
  }

  if (user.imageCredits < request.count) {
    throw new AppError({
      description:
        'You do not have enough image credits to generate this many images. Please try with fewer images, or buy more credits.',
      httpCode: HttpCode.BAD_REQUEST,
      websocket: {
        userId: request.userId,
        errorCode: ErrorType.ImageGenerationError,
        context: {
          ...request.linking,
        },
      },
    });
  }

  if (!request.modelId) {
    const defaultModel = await prisma.imageModel.findFirst({
      where: {
        default: true,
      },
    });

    if (!defaultModel) {
      throw new AppError({
        description: 'Default model not found.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        websocket: {
          userId: request.userId,
          errorCode: ErrorType.ImageGenerationError,
          context: {
            ...request.linking,
          },
        },
      });
    }

    request.modelId = defaultModel.id;
  }

  const imagePromises = [];
  for (let i = 0; i < request.count; i++) {
    const imagePromise = generateSingleImage(request);
    imagePromises.push(imagePromise);
  }

  const images = await Promise.all(imagePromises);
  return images.filter((i) => !!i);
};

const generateSingleImage = async (
  request: ImageGenerationRequest,
): Promise<Image | undefined> => {
  const image = await prisma.image.create({
    data: {
      userId: request.userId,
      prompt: request.prompt,
      negativePrompt: request.negativePrompt,
      stylePreset: request.stylePreset,
      ...request.linking,
      primary: request.forceImagePrimary || false,
      generating: true,
      failed: false,
      modelId: request.modelId,
    },
  });
  await checkImageStatusQueue.add(
    {
      userId: request.userId,
      imageId: image.id,
    },
    {
      delay: 120000,
    },
  );
  const imageGenerationResponse = await generateImageFromProperProvider({
    ...request,
    imageId: image.id,
  });

  if (!imageGenerationResponse) {
    await prisma.image.update({
      where: {
        id: image.id,
      },
      data: {
        generating: false,
        failed: true,
      },
    });

    return;
  }

  const updatedImage = await prisma.image.update({
    where: {
      id: image.id,
    },
    data: {
      generating: false,
      uri: imageGenerationResponse.uri,
      seed: imageGenerationResponse.seed.toString(),
    },
  });

  await sendWebsocketMessage(
    request.userId,
    WebSocketEvent.ImageCreated,
    updatedImage,
  );

  return updatedImage;
};

const generateImageFromProperProvider = async (
  request: ImageGenerationRequest,
): Promise<GeneratedImage | undefined> => {
  const model = await prisma.imageModel.findUnique({
    where: {
      id: request.modelId,
    },
    include: {
      artists: true,
    },
  });

  if (!model) {
    throw new AppError({
      description: 'Image model not found.',
      httpCode: HttpCode.BAD_REQUEST,
      websocket: {
        userId: request.userId,
        errorCode: ErrorType.ImageGenerationError,
        context: {
          ...request.linking,
        },
      },
    });
  }

  track(AppEvent.ConjureImage, request.userId, undefined, {
    prompt: request.prompt,
    negativePrompt: request.negativePrompt,
    stylePreset: request.stylePreset,
    count: request.count,
  });

  let imageGenerationResponse: GeneratedImage;

  try {
    if (model.stableDiffusionApiModel) {
      imageGenerationResponse = await retry(async () => {
        return await generateStableDiffusionImage(request);
      });
    } else {
      imageGenerationResponse = await retry(
        async () => {
          return await generateMythWeaverModelImage(request, model);
        },
        undefined,
        {
          onAttemptFail: (data: any) => {
            // if we get a 400, fail immediately, don't retry
            if ((data.error as AxiosError)?.response?.status === 400) {
              throw data.error;
            }
          },
        },
      );
    }
  } catch (err) {
    const e = err as AxiosError;
    if (e?.response?.status === 400) {
      await sendWebsocketMessage(request.userId, WebSocketEvent.ImageFiltered, {
        description:
          'The returned images did not pass our content filter. Please rephrase your prompt to avoid NSFW content, and try again.',
        context: {
          ...request.linking,
        },
      });
    } else {
      await sendWebsocketMessage(request.userId, WebSocketEvent.Error, {
        description:
          'The image generation service was unable to generate an image. Please try again shortly.',
        context: {
          ...request.linking,
        },
      });
    }

    return;
  }

  if (!imageGenerationResponse) {
    logger.warn('Image generation response was undefined.');
    return;
  }

  if (request.imageId) {
    const image = await prisma.image.findUnique({
      where: {
        id: request.imageId,
      },
    });
    if (image?.failed) {
      return;
    }
  }

  await sendWebsocketMessage(
    request.userId,
    WebSocketEvent.ImageGenerationDone,
    {
      image: imageGenerationResponse,
    },
  );

  const imageCredits = await modifyImageCreditCount(
    request.userId,
    -1,
    ImageCreditChangeType.USER_INITIATED,
    `Image generation: ${imageGenerationResponse.uri}, ${JSON.stringify(request.linking)}`,
  );

  await sendWebsocketMessage(
    request.userId,
    WebSocketEvent.UserImageCreditCountUpdated,
    imageCredits,
  );

  if (model.artists.length === 1) {
    const { amountSupportingArtistsUsd } = await prisma.user.update({
      where: {
        id: request.userId,
      },
      data: {
        amountSupportingArtistsUsd: {
          increment: 0.01,
        },
      },
    });

    await sendWebsocketMessage(
      request.userId,
      WebSocketEvent.UserArtistContributionsUpdated,
      amountSupportingArtistsUsd,
    );
  }

  return imageGenerationResponse;
};
