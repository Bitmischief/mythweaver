import Queue, { Job } from 'bull';
import { config } from '@/modules/core/workers/worker.config';
import {
  WebSocketEvent,
  WebSocketProvider,
} from '@/providers/websocketProvider';
import { Logger } from '@/modules/core/logging/logger';
import { AssemblyAIProvider } from '@/providers/assemblyAI';
import { SessionsDataProvider } from '@/modules/sessions/sessions.dataprovider';
import { TranscriptionService } from '@/modules/sessions/transcription.service';

export interface TranscriptEvent {
  sessionId: number;
  userId: number;
  transcriptId: string;
}

const POLL_INTERVAL = 30 * 1000; // 30 seconds
const MAX_GENERATION_TIME = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = Math.ceil(MAX_GENERATION_TIME / POLL_INTERVAL);

export const sessionTranscriptQueue = new Queue<TranscriptEvent>(
  'session-transcript',
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

export class SessionTranscriptWorker {
  constructor(
    private readonly logger: Logger,
    private readonly assemblyAIProvider: AssemblyAIProvider,
    private readonly transcriptionService: TranscriptionService,
    private readonly sessionsDataProvider: SessionsDataProvider,
    private readonly webSocketProvider: WebSocketProvider,
  ) {
    this.initializeWorker();
  }

  initializeWorker(): void {
    sessionTranscriptQueue.process(async (job: Job<TranscriptEvent>) => {
      this.logger.info('Processing session transcript completion job', {
        jobId: job.id,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts,
        data: job.data,
      });

      const { transcriptId } = job.data;

      const transcript =
        await this.assemblyAIProvider.getTranscript(transcriptId);

      this.logger.info(`Received transcript status`, {
        transcriptId,
        status: transcript.status,
        attempt: job.attemptsMade + 1,
      });

      if (transcript.status === 'completed') {
        this.logger.info(`Transcript completed`, {
          transcriptId,
          transcript,
        });

        //@TODO run post-transcript activities here
        // summarization, etc
        this.logger.info('Generating recap and summary', { transcriptId });

        const recap = await this.transcriptionService.recapTranscript(
          transcript.id,
        );

        const summary = await this.transcriptionService.summarizeTranscript(
          transcript.id,
        );

        await this.sessionsDataProvider.updateSession(job.data.sessionId, {
          summary,
          recap,
        });

        await this.webSocketProvider.sendMessage(
          job.data.userId,
          WebSocketEvent.TranscriptionComplete,
          {},
        );

        job.discard();
      }

      if (transcript.status === 'error') {
        this.logger.error(`Transcript failed on assembly AI`, {
          transcriptId,
          transcript,
        });

        await this.handleFailure(job);
      }

      throw new Error(
        `Job still processing. Attempt ${job.attemptsMade + 1} of ${job.opts.attempts}`,
      );
    });

    sessionTranscriptQueue.on(
      'failed',
      async (job: Job<TranscriptEvent>, err: Error) => {
        if (job.attemptsMade >= (job.opts.attempts || MAX_ATTEMPTS)) {
          this.logger.error(
            'Transcript timed out',
            {
              jobId: job.id,
              attempts: job.attemptsMade,
              maxAttempts: job.opts.attempts,
              data: job.data,
            },
            err,
          );

          await this.handleFailure(job);
        }
      },
    );

    this.logger.info('MythWeaver image worker initialized successfully');
  }

  private async handleFailure(job: Job<TranscriptEvent>): Promise<void> {
    const { sessionId, userId } = job.data;

    this.logger.error('Transcript failed', {
      sessionId,
      userId,
    });

    job.discard();

    await this.webSocketProvider.sendMessage(userId, WebSocketEvent.Error, {
      description: 'Transcript failed to generate properly. Please try again.',
    });
  }
}
