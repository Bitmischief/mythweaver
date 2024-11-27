import { ImageModel } from '@prisma/client';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { v4 as uuidv4 } from 'uuid';
import { saveImage } from '../dataStorage';
import logger from '../../lib/logger';
import {
  GeneratedImage,
  ImageGenerationRequest,
} from '../../modules/images/images.interface';
import runPodProvider from '../../providers/runPod';

const POLL_INTERVAL = 2 * 1000;

async function pollJobStatus(
  model: ImageModel,
  jobId: string,
  startTime: number,
  imageId: string,
  retryCount: number,
): Promise<GeneratedImage> {
  logger.info(`Starting to poll job status`, {
    jobId,
    imageId,
    modelId: model.id,
    retryCount,
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    logger.info(`Checking job status`, { jobId, modelId: model.id });
    const status = await runPodProvider.checkJobStatus(model, jobId);
    logger.info(`Received job status`, { jobId, status: status.status });

    if (status.status === 'COMPLETED' && status.output) {
      logger.info(`Job completed successfully`, { jobId, imageId });
      const url = await saveImage(imageId, status.output.base64);
      logger.info(`Image saved successfully`, { imageId, url });
      return {
        uri: url,
        seed: status.output.seed,
      };
    }

    if (status.status === 'FAILED') {
      logger.error(`Job failed`, { jobId, imageId, modelId: model.id });
      throw new AppError({
        description: 'Image generation failed',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    const elapsedTime = Date.now() - startTime;
    logger.info(`Checking timeout`, {
      jobId,
      elapsedTime,
      maxTime: MAX_GENERATION_TIME,
    });

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

export const generateMythWeaverModelImage = async (
  request: ImageGenerationRequest,
  model: ImageModel,
): Promise<GeneratedImage> => {
  logger.info(`Starting image generation`, {
    modelId: model.id,
    modelDescription: model.description,
    userId: request.userId,
  });

  if (!model.executionUri) {
    logger.error(`Missing execution URI`, { modelId: model.id });
    throw new AppError({
      description: 'Model does not have an execution URI.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  }

  const imageId = uuidv4();
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      logger.info(`Submitting job`, {
        imageId,
        retryCount,
        modelId: model.id,
        userId: request.userId,
      });

      const job = await runPodProvider.submitJob(model, request);
      logger.info(`Job submitted successfully`, { jobId: job.id, imageId });

      const startTime = Date.now();
      return await pollJobStatus(model, job.id, startTime, imageId, retryCount);
    } catch (error) {
      if (error instanceof Error && error.message === 'RETRY_NEEDED') {
        logger.info(`Retry needed, attempting again`, {
          imageId,
          retryCount: retryCount + 1,
        });
        retryCount++;
        continue;
      }
      logger.error(`Unexpected error during image generation`, {
        error,
        imageId,
        modelId: model.id,
        retryCount,
      });
      throw error;
    }
  }

  logger.error(`Max retries exceeded`, { imageId, retryCount });
  throw new AppError({
    description: 'Failed to generate image after maximum retries',
    httpCode: HttpCode.INTERNAL_SERVER_ERROR,
  });
};
