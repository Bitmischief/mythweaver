import { ImageModel } from '@prisma/client';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import logger from '../../lib/logger';
import {
  ApiImageGenerationResponse,
  ImageGenerationRequest,
} from '../../modules/images/images.interface';
import runPodProvider from '../../providers/runPod';
import { Image } from '@prisma/client';

const POLL_INTERVAL = 2 * 1000;
const MAX_GENERATION_TIME = 5 * 60 * 1000;

async function pollJobStatus(
  model: ImageModel,
  jobId: string,
  startTime: number,
  images: Image[],
): Promise<ApiImageGenerationResponse[]> {
  logger.info(`Starting to poll job status`, {
    jobId,
    imageIds: images.map((image) => image.id),
    modelId: model.id,
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    logger.info(`Checking job status`, { jobId, modelId: model.id });
    const status = await runPodProvider.checkJobStatus(model, jobId);
    logger.info(`Received job status`, { jobId, status: status.status });

    if (status.status === 'COMPLETED' && status.output) {
      return status.output;
    }

    if (status.status === 'FAILED') {
      logger.error(`Job failed`, {
        jobId,
        imageIds: images.map((image) => image.id),
        modelId: model.id,
      });
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

    if (elapsedTime > MAX_GENERATION_TIME) {
      logger.error(`Job timed out`, {
        jobId,
        imageIds: images.map((image) => image.id),
        modelId: model.id,
      });
      throw new AppError({
        description: 'Image generation timed out',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

export const generateMythWeaverModelImage = async (
  request: ImageGenerationRequest,
  model: ImageModel,
  images: Image[],
): Promise<ApiImageGenerationResponse[]> => {
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

  logger.info(`Submitting job`, {
    imageIds: images.map((image) => image.id),
    modelId: model.id,
    userId: request.userId,
  });

  const job = await runPodProvider.submitJob(model, request);
  logger.info(`Job submitted successfully`, {
    jobId: job.id,
    imageIds: images.map((image) => image.id),
  });

  const startTime = Date.now();
  return await pollJobStatus(model, job.id, startTime, images);
};
