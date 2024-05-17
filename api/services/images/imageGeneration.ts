import { prisma } from '../../lib/providers/prisma';
import { sendWebsocketMessage, WebSocketEvent } from '../websockets';
import { generateStableDiffusionImage } from './stableDiffusionImageService';
import {
  GeneratedImage,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from './models';
import { Image, ImageCreditChangeType } from '@prisma/client';
import { generateMythWeaverModelImage } from './mythweaverImageService';
import logger from '../../lib/logger';
import { modifyImageCreditCount } from '../credits';
import { AppEvent, track } from '../../lib/tracking';

export const generateImage = async (request: ImageGenerationRequest) => {
  const user = await prisma.user.findUnique({
    where: {
      id: request.userId,
    },
  });

  if (!user) {
    await sendWebsocketMessage(request.userId, WebSocketEvent.ImageError, {
      message: 'User not found.',
    });

    return undefined;
  }

  if (user.imageCredits < request.count) {
    await sendWebsocketMessage(request.userId, WebSocketEvent.ImageError, {
      message:
        'You do not have enough image credits to generate this many images. Please try with fewer images, or buy more credits.',
    });

    return undefined;
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
    await sendWebsocketMessage(request.userId, WebSocketEvent.ImageError, {
      message: 'Model not found.',
    });

    return;
  }

  track(AppEvent.ConjureImage, request.userId, undefined, {
    prompt: request.prompt,
    negativePrompt: request.negativePrompt,
    stylePreset: request.stylePreset,
    count: request.count,
  });

  let imageGenerationResponse: GeneratedImage | undefined;

  if (model.stableDiffusionApiModel) {
    imageGenerationResponse = await generateImageWithRetry(request.userId, () =>
      generateStableDiffusionImage(request),
    );
  } else {
    imageGenerationResponse = await generateImageWithRetry(request.userId, () =>
      generateMythWeaverModelImage(request, model),
    );
  }

  if (!imageGenerationResponse) {
    await sendWebsocketMessage(request.userId, WebSocketEvent.ImageError, {
      message:
        'After multiple retries, we were unable to generate an image. Please try again.',
    });

    return;
  }

  await sendWebsocketMessage(
    request.userId,
    WebSocketEvent.ImageGenerationDone,
    {},
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

const generateImageWithRetry = async (
  userId: number,
  imageGenerationFunction: () => Promise<ImageGenerationResponse>,
  maxRetries = 10,
) => {
  let tries = 0;

  do {
    let response: ImageGenerationResponse | undefined = undefined;

    try {
      response = await imageGenerationFunction();
    } catch (err) {
      logger.error('Error generating image.', { userId });
    }

    if (response && response.images && response.images.length > 0) {
      return response.images[0];
    }

    tries++;
  } while (tries < maxRetries);

  await sendWebsocketMessage(userId, WebSocketEvent.ImageFiltered, {
    message:
      'The image generation service was unable to generate an image that met the criteria. Please try again.',
  });

  return undefined;
};
