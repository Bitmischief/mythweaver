import Queue, { Job } from 'bull';
import { ImageModel, Image } from '@prisma/client';
import { ImageGenerationRequest } from '@/modules/images/images.interface';
import { config } from '@/worker/config';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import {
  WebSocketProvider,
  WebSocketEvent,
} from '@/providers/websocketProvider';
import { MythWeaverLogger } from '@/lib/logger';
import { RunPodProvider } from '@/providers/runPod';
import { ImagesDataProvider } from '@/modules/images/images.dataprovider';
import { CompletedImageService } from '@/modules/images/completedImage.service';

interface CheckJobStatusData {
  model: ImageModel;
  runpodJobId: string;
  images: Image[];
  userId: number;
  request: ImageGenerationRequest;
}

const POLL_INTERVAL = 2 * 1000;
const MAX_GENERATION_TIME = 5 * 60 * 1000;
const MAX_ATTEMPTS = Math.ceil(MAX_GENERATION_TIME / POLL_INTERVAL);

export const mythweaverImageQueue = new Queue<CheckJobStatusData>(
  'mythweaver-image-status',
  config,
  {
    defaultJobOptions: {
      attempts: MAX_ATTEMPTS,
      backoff: {
        type: 'fixed',
        delay: POLL_INTERVAL,
      },
      removeOnComplete: true,
      removeOnFail: true,
    },
  },
);

export class MythWeaverImageWorker {
  private static instance: MythWeaverImageWorker;
  private static isInitialized = false;

  constructor(
    private readonly logger: MythWeaverLogger,
    private readonly runPodProvider: RunPodProvider,
    private readonly imagesDataProvider: ImagesDataProvider,
    private readonly completedImageService: CompletedImageService,
    private readonly webSocketProvider: WebSocketProvider,
  ) {
    if (MythWeaverImageWorker.instance) {
      return MythWeaverImageWorker.instance;
    }
    MythWeaverImageWorker.instance = this;
  }

  async initializeWorker(): Promise<void> {
    if (MythWeaverImageWorker.isInitialized) {
      this.logger.info(
        'MythWeaver image worker already initialized, skipping initialization',
      );
      return;
    }

    mythweaverImageQueue.process(async (job: Job<CheckJobStatusData>) => {
      this.logger.info('Processing mythweaver image status check job', {
        jobId: job.id,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts,
        data: {
          ...job.data,
          request: {
            ...job.data.request,
            referenceImage: !!job.data.request.referenceImage,
          },
        },
      });

      const { model, runpodJobId: jobId, images, userId, request } = job.data;

      const status = await this.runPodProvider.checkJobStatus(model, jobId);
      this.logger.info(`Received job status`, {
        jobId,
        status: status.status,
        attempt: job.attemptsMade + 1,
      });

      if (status.status === 'IN_QUEUE' || status.status === 'IN_PROGRESS') {
        this.logger.info('Sending image generation update', {
          jobId,
          status: status.status,
          imageIds: images.map((image) => image.id),
        });

        await this.webSocketProvider.sendMessage(
          userId,
          WebSocketEvent.ImageGenerationUpdate,
          {
            jobId,
            imageIds: images.map((image: Image) => image.id),
            status: status.status,
          },
        );
      }

      if (status.status === 'COMPLETED' && status.output) {
        await this.completedImageService.processGeneratedImages(
          status.output,
          images,
          request,
          model,
        );
        return;
      }

      if (status.status === 'FAILED' || status.status === 'CANCELLED') {
        this.logger.error(`Job failed`, {
          jobId,
          imageIds: images.map((image: Image) => image.id),
          modelId: model.id,
        });

        await this.handleFailure(
          job,
          images,
          userId,
          'Image generation failed',
        );

        throw new AppError({
          description: 'Image generation failed',
          httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        });
      }

      throw new Error(
        `Job still processing. Attempt ${job.attemptsMade + 1} of ${job.opts.attempts}`,
      );
    });

    mythweaverImageQueue.on(
      'failed',
      async (job: Job<CheckJobStatusData>, err: Error) => {
        if (job.attemptsMade >= (job.opts.attempts || MAX_ATTEMPTS)) {
          const { images, userId } = job.data;

          this.logger.error(
            'Job failed permanently',
            {
              jobId: job.id,
              attempts: job.attemptsMade,
              maxAttempts: job.opts.attempts,
              data: job.data,
            },
            err,
          );

          await this.handleFailure(
            job,
            images,
            userId,
            'Image generation timed out',
          );
        }
      },
    );

    MythWeaverImageWorker.isInitialized = true;
    this.logger.info('MythWeaver image worker initialized successfully');
  }

  static getInstance(
    logger: MythWeaverLogger,
    runPodProvider: RunPodProvider,
    imagesDataProvider: ImagesDataProvider,
    completedImageService: CompletedImageService,
    webSocketProvider: WebSocketProvider,
  ): MythWeaverImageWorker {
    if (!MythWeaverImageWorker.instance) {
      MythWeaverImageWorker.instance = new MythWeaverImageWorker(
        logger,
        runPodProvider,
        imagesDataProvider,
        completedImageService,
        webSocketProvider,
      );
    }
    return MythWeaverImageWorker.instance;
  }

  private async handleFailure(
    job: Job<CheckJobStatusData>,
    images: Image[],
    userId: number,
    errorMessage: string,
  ): Promise<void> {
    for (const image of images) {
      await this.imagesDataProvider.updateImage(image.id, {
        generating: false,
        failed: true,
      });

      await this.webSocketProvider.sendMessage(
        userId,
        WebSocketEvent.ImageGenerationError,
        {
          imageId: image.id,
          description: errorMessage,
        },
      );
    }

    job.discard();
  }

  async addJob(data: CheckJobStatusData): Promise<Job<CheckJobStatusData>> {
    return mythweaverImageQueue.add(data);
  }

  async shutdown(): Promise<void> {
    await mythweaverImageQueue.close();
  }
}
