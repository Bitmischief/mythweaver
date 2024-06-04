import { prisma } from '../../lib/providers/prisma';
import { AppEvent, track } from '../../lib/tracking';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';

export const checkImageStatus = async (data: any) => {
  const image = await prisma.image.findUnique({
    where: {
      id: data.imageId,
    },
  });

  if (!image?.failed && !image?.uri) {
    await prisma.image.update({
      where: {
        id: data.imageId,
      },
      data: {
        failed: true,
        generating: false,
      },
    });

    track(AppEvent.ImageTimeout, data.userId, undefined, {
      imageId: data.imageId,
    });

    await sendWebsocketMessage(
      data.userId,
      WebSocketEvent.ImageGenerationTimeout,
      data.imageId,
    );
  }
};
