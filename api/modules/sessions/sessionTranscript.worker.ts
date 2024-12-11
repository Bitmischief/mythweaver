import Queue, { Job } from 'bull';
import { config } from '../../worker/config';
import {
  WebSocketEvent,
  sendWebsocketMessage,
} from '../../services/websockets';
import { MythWeaverLogger } from '../../lib/logger';
import { AssemblyAIProvider } from '@/providers/assemblyAI';

interface TranscriptEvent {
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
  private static isInitialized = false;

  constructor(
    private readonly logger: MythWeaverLogger,
    private readonly assembly: AssemblyAIProvider,
  ) {}

  initializeWorker(): void {
    sessionTranscriptQueue.process(async (job: Job<TranscriptEvent>) => {
      this.logger.info('Processing session transcript completion job', {
        jobId: job.id,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts,
        data: job.data,
      });

      const { transcriptId } = job.data;

      const transcript = await this.assembly.getTranscript(transcriptId);

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

    SessionTranscriptWorker.isInitialized = true;
    this.logger.info('MythWeaver image worker initialized successfully');
  }

  private async handleFailure(job: Job<TranscriptEvent>): Promise<void> {
    const { sessionId, userId } = job.data;

    this.logger.error('Transcript failed', {
      sessionId,
      userId,
    });

    job.discard();

    await sendWebsocketMessage(userId, WebSocketEvent.Error, {
      description: 'Transcript failed to generate properly. Please try again.',
    });
  }

  async addJob(data: TranscriptEvent): Promise<Job<TranscriptEvent>> {
    return sessionTranscriptQueue.add(data);
  }

  async shutdown(): Promise<void> {
    await sessionTranscriptQueue.close();
  }
}
