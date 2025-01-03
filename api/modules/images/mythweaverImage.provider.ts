import { ImageModel, Image } from '@prisma/client';
import { AppError, HttpCode } from '@/modules/core/errors/AppError';
import { Logger } from '@/modules/core/logging/logger';
import { ImageGenerationRequest } from '@/modules/images/images.interface';
import { RunPodProvider } from '@/providers/runPod';
import { Queue } from 'bull';
import { CheckJobStatusData } from '@/modules/images/mythweaverImage.worker';

export class MythWeaverImageProvider {
  constructor(
    private readonly logger: Logger,
    private readonly runPodProvider: RunPodProvider,
    private readonly mythweaverImageQueue: Queue<CheckJobStatusData>,
  ) {}

  async generateMythWeaverModelImage(
    request: ImageGenerationRequest,
    model: ImageModel,
    images: Image[],
  ) {
    this.logger.info(`Starting image generation`, {
      modelId: model.id,
      modelDescription: model.description,
      userId: request.userId,
    });

    if (!model.executionUri) {
      this.logger.error(`Missing execution URI`, { modelId: model.id });
      throw new AppError({
        description: 'Model does not have an execution URI.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    const transformedRequest = {
      ...request,
      imageStrength: 1 - (request.imageStrength || 0.35),
    };

    this.logger.info(`Submitting job`, {
      imageIds: images.map((image) => image.id),
      modelId: model.id,
      userId: request.userId,
    });

    const job = await this.runPodProvider.submitJob(model, transformedRequest);
    this.logger.info(`Job submitted successfully`, {
      jobId: job.id,
      imageIds: images.map((image) => image.id),
    });

    await this.mythweaverImageQueue.add({
      model,
      runpodJobId: job.id,
      images,
      userId: request.userId,
      request,
    });
  }
}
