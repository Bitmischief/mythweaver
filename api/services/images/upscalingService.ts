import { prisma } from '../../lib/providers/prisma';
import { sendWebsocketMessage, WebSocketEvent } from '../websockets';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { stableDiffusionUpscaleImage } from './stableDiffusionImageService';
import { modifyImageCreditCount } from '../credits';
import { ImageCreditChangeType } from '@prisma/client';
import retry from 'async-await-retry';

export const upscaleImage = async (userId: number, imageId: number) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError({
      httpCode: HttpCode.BAD_REQUEST,
      description: 'User not found.',
    });
  }

  if (user.imageCredits < 1) {
    throw new AppError({
      httpCode: HttpCode.BAD_REQUEST,
      description:
        'You do not have enough image credits to upscale this image.',
    });
  }

  const image = await prisma.image.findUnique({
    where: {
      id: imageId,
    },
  });

  if (!image) {
    throw new AppError({
      httpCode: HttpCode.BAD_REQUEST,
      description: 'Image not found.',
    });
  }

  if (!image.uri) {
    throw new AppError({
      httpCode: HttpCode.BAD_REQUEST,
      description: 'Image URI not found.',
    });
  }

  const upscaledUri = await retry(async () => {
    return await stableDiffusionUpscaleImage({
      userId,
      imageId,
      imageUri: image.uri || '',
    });
  });

  const updatedImage = await prisma.image.update({
    where: {
      id: imageId,
    },
    data: {
      userId,
      uri: upscaledUri,
      upscaled: true,
    },
  });

  await sendWebsocketMessage(
    userId,
    WebSocketEvent.ImageUpscaled,
    updatedImage,
  );

  await sendWebsocketMessage(userId, WebSocketEvent.ImageUpscalingDone, {});

  await modifyImageCreditCount(
    user.id,
    -1,
    ImageCreditChangeType.USER_INITIATED,
    `Image upscale: ${upscaledUri}`,
  );

  return image;
};
