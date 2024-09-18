import Queue from 'bull';
import { prisma } from '../../lib/providers/prisma';
import { AppEvent, track } from '../../lib/tracking';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';
import { config } from '../config';
import logger from '../../lib/logger';

export const checkImageStatusQueue = new Queue('check-image-status', config);

checkImageStatusQueue.process(async (job, done) => {
  logger.info('Processing check image status job', job.data);

  try {
    await checkImageStatus(job.data);
    logger.info('Completed processing check image status job', job.data);
    done();
  } catch (err) {
    logger.error('Error processing check image status job!', err);
    done(new Error('Error processing check image status job!'));
  }
});

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
