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
    },
  });

  const imageGenerationResponse = await generateImageFromProperProvider({
    ...request,
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
      imageGenerationResponse = await retry(async () => {
        return await generateMythWeaverModelImage(request, model);
      });
    }
  } catch (err) {
    throw new AppError({
      description:
        'The image generation service was unable to generate an image that met the criteria. Please try again.',
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

  return imageGenerationResponse;
};