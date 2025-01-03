import { ImageModel, Image } from '@prisma/client';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import { MythWeaverLogger } from '@/lib/logger';
import { ImageGenerationRequest } from '@/modules/images/images.interface';
import { RunPodProvider } from '@/providers/runPod';
import { MythWeaverImageWorker } from '@/modules/images/mythweaverImage.worker';

export class MythWeaverImageProvider {
  constructor(
    private readonly logger: MythWeaverLogger,
    private readonly runPodProvider: RunPodProvider,
    private readonly mythweaverImageWorker: MythWeaverImageWorker,
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

    this.logger.info(`Submitting job`, {
      imageIds: images.map((image) => image.id),
      modelId: model.id,
      userId: request.userId,
    });

    const job = await this.runPodProvider.submitJob(model, request);
    this.logger.info(`Job submitted successfully`, {
      jobId: job.id,
      imageIds: images.map((image) => image.id),
    });

    await this.mythweaverImageWorker.addJob({
      model,
      runpodJobId: job.id,
      images,
      userId: request.userId,
      request,
    });
  }
}
