import Queue from 'bull';
import { AssemblyAI, Transcript } from 'assemblyai';
import retry from 'async-await-retry';
import { TranscribeSessionEvent, getSession } from '../../dataAccess/sessions';
import { prisma } from '../../lib/providers/prisma';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';
import { Prisma, Session, TranscriptStatus } from '@prisma/client';
import logger from '../../lib/logger';
import { SpeechModel } from 'assemblyai/src/types/openapi.generated';
import { sleep } from 'openai/core';
import { ProcessedTranscript } from '../../dataAccess/transcript';
import { config } from '../config';
import {
  recapTranscript,
  summarizeTranscript,
} from '../../services/transcription';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string,
});

export const sessionTranscriptionQueue = new Queue<TranscribeSessionEvent>(
  'transcribe-session',
  config,
  {
    defaultJobOptions: {
      timeout: 30 * 60 * 1000,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60 * 1000,
      },
    },
  },
);

sessionTranscriptionQueue.process(async (job, done) => {
  logger.info('Starting to process session transcript job', {
    jobData: job.data,
  });

  try {
    await transcribeSession(job.data);
    logger.info('Successfully completed processing session transcript job', {
      jobData: job.data,
    });
    done();
  } catch (err) {
    logger.error(
      'Error processing session transcript job',
      { jobData: job.data },
      err,
    );
    done(new Error('Error processing session transcript job!'));
  }
});

export const transcribeSession = async (request: TranscribeSessionEvent) => {
  const { sessionId, userId } = request;
  logger.info('Starting transcribeSession', { sessionId, userId });

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    logger.error('Session not found', { sessionId });
    throw new AppError({
      description: 'Session not found.',
      httpCode: HttpCode.NOT_FOUND,
    });
  }

  if (!session.audioUri) {
    logger.error('Session audio not found', { sessionId });
    throw new AppError({
      description: 'Session audio not found.',
      httpCode: HttpCode.NOT_FOUND,
    });
  }

  logger.info('Session and audio found, proceeding with transcription', {
    sessionId,
    audioUri: session.audioUri,
  });

  await retry(async () => {
    try {
      await processSessionTranscription(userId, session);
    } catch (error) {
      logger.error(
        'Error transcribing session audio',
        { sessionId, userId },
        error,
      );

      await prisma.sessionTranscription.update({
        where: { sessionId: sessionId },
        data: { status_new: TranscriptStatus.FAILED },
      });
      logger.info('Updated session transcription status to FAILED', {
        sessionId,
      });
    }
  });
};

const processSessionTranscription = async (
  userId: number,
  session: Session,
) => {
  logger.info('Starting processSessionTranscription', {
    userId,
    sessionId: session.id,
  });

  const sessionTranscript = await createOrUpdateSessionTranscriptRecord(
    session.id,
    userId,
  );

  if (!sessionTranscript) {
    logger.info(
      'Session transcript already processed or processing, aborting',
      { sessionId: session.id },
    );
    return;
  }

  logger.info('Preparing transcription data', {
    sessionId: session.id,
    audioUri: session.audioUri,
  });

  const data = {
    audio:
      session.audioUri?.indexOf('https') === -1
        ? `https://${session.audioUri}`
        : session.audioUri || '',
    speaker_labels: true,
    auto_highlights: true,
    speech_model: 'best' as SpeechModel,
  };

  let transcript: Transcript;
  try {
    logger.info('Sending transcription request to AssemblyAI', {
      sessionId: session.id,
    });
    transcript = await client.transcripts.transcribe(data);
    logger.info('Received transcription response from AssemblyAI', {
      sessionId: session.id,
      transcriptId: transcript.id,
    });
  } catch (error) {
    logger.error(
      'Error transcribing session audio with AssemblyAI',
      { sessionId: session.id },
      error,
    );
    throw new AppError({
      description: 'Error transcribing session audio.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  }

  await prisma.sessionTranscription.update({
    where: { sessionId: sessionTranscript.sessionId },
    data: {
      status_new: TranscriptStatus.PROCESSING,
      transcriptExternalId: transcript.id,
    },
  });
  logger.info('Updated session transcription status to PROCESSING', {
    sessionId: session.id,
    transcriptId: transcript.id,
  });

  await sendWebsocketMessage(userId, WebSocketEvent.TranscriptionStarted, {
    sessionId: session.id,
  });
  logger.info('Sent WebSocket message: TranscriptionStarted', {
    userId,
    sessionId: session.id,
  });

  logger.info('Starting to poll for transcript completion', {
    sessionId: session.id,
    transcriptId: transcript.id,
  });
  await pollForTranscript(transcript.id);
  logger.info('Finished polling, transcript is ready', {
    sessionId: session.id,
    transcriptId: transcript.id,
  });

  await processCompletedTranscript(
    session.campaignId,
    session.id,
    userId,
    transcript.id,
  );
};

const processCompletedTranscript = async (
  campaignId: number,
  sessionId: number,
  userId: number,
  transcriptId: string,
) => {
  logger.info('Starting processCompletedTranscript', {
    campaignId,
    sessionId,
    userId,
    transcriptId,
  });

  const transcript = await client.transcripts.get(transcriptId);
  logger.info('Retrieved transcript from AssemblyAI', {
    transcriptId,
    status: transcript.status,
  });

  if (transcript.status === 'error') {
    logger.error('Transcript status is error', { transcriptId });
    throw new AppError({
      description: 'Error transcribing session audio.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  }

  if (!transcript.id) {
    logger.error('Transcript ID is missing', { transcriptId });
    throw new AppError({
      description: '',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  }

  logger.info('Generating recap and summary', { transcriptId });
  const recap = await recapTranscript(transcript.id);
  const summary = await summarizeTranscript(transcript.id);

  logger.info('Retrieving sentences and paragraphs', { transcriptId });
  const { sentences } = await client.transcripts.sentences(transcript.id);
  const { paragraphs } = await client.transcripts.paragraphs(transcript.id);

  const fullTranscript: ProcessedTranscript = {
    sentences,
    paragraphs,
    recap,
    summary,
  };

  logger.info('Updating session transcription in database', {
    sessionId,
    transcriptId,
  });
  await prisma.sessionTranscription.update({
    where: { sessionId },
    data: {
      transcript: Prisma.DbNull,
      transcriptExternalId: transcript.id,
      status_new: TranscriptStatus.COMPLETE,
      sentences,
      paragraphs,
    },
  });

  logger.info('Updating session with summary and recap', { sessionId });
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      summary: fullTranscript.summary,
      recap: fullTranscript.recap,
    },
  });

  logger.info('Sending WebSocket message: TranscriptionComplete', {
    userId,
    sessionId,
  });
  await sendWebsocketMessage(userId, WebSocketEvent.TranscriptionComplete, {
    sessionId: sessionId,
    summary: fullTranscript.summary,
    recap: fullTranscript.recap,
  });
};

// const postprocessTranscript = async (
//   campaignId: number,
//   transcript: ProcessedTranscript,
// ) => {
//   const updatedSummary = await generateText(
//     campaignId,
//     `You are a helpful assistant. Your task is to correct any spelling discrepancies in the transcribed text from a tabletop roleplaying game.
//     Make sure that the names of any common roleplaying game terms, fictional race names, etc are corrected.
//     Only add necessary punctuation such as periods, commas, and capitalization, and use only the context provided.
//     Respond with just the summary and don't include a preamble, introduction, or the corrections made. If there are
//     no corrections to be made, please return the summary as is. Here is the
//     original summary: ${transcript.summary}`,
//   );

//   const updatedRecap = await generateText(
//     campaignId,
//     `You are a helpful assistant. Your task is to correct any spelling discrepancies in the transcribed text from a tabletop roleplaying game.
//     Make sure that the names of any common roleplaying game terms, fictional race names, etc are corrected.
//     Only add necessary punctuation such as periods, commas, and capitalization, and use only the context provided.
//     Respond with just the recap and don't include a preamble, introduction, or the corrections made. If there are
//     no corrections to be made, please return the recap as is. Here is the
//     original recap: ${transcript.recap}`,
//   );

//   return {
//     ...transcript,
//     summary: updatedSummary,
//     recap: updatedRecap,
//   };
// };

const pollForTranscript = async (transcriptId: string) => {
  const pollingInterval = 3000;
  const maxPollDuration = 60 * 60 * 1000;
  let iterations = 0;

  logger.info('Starting to poll for transcript', {
    transcriptId,
    pollingInterval,
    maxPollDuration,
  });

  do {
    const transcript = await client.transcripts.get(transcriptId);
    logger.info('Polling transcript status', {
      transcriptId,
      status: transcript.status,
      iteration: iterations,
    });

    if (transcript.status === 'completed' || transcript.status === 'error') {
      logger.info('Transcript polling finished', {
        transcriptId,
        status: transcript.status,
      });
      return transcript;
    }

    iterations++;
    await sleep(pollingInterval);
  } while (iterations * pollingInterval < maxPollDuration);

  logger.warn('Transcript polling timed out', {
    transcriptId,
    totalDuration: iterations * pollingInterval,
  });
};

const createOrUpdateSessionTranscriptRecord = async (
  sessionId: number,
  userId: number,
) => {
  logger.info('Starting createOrUpdateSessionTranscriptRecord', {
    sessionId,
    userId,
  });

  let sessionTranscript = await prisma.sessionTranscription.findUnique({
    where: { sessionId },
  });
  logger.info('Existing session transcript', {
    sessionId,
    status: sessionTranscript?.status_new,
  });

  const session = await getSession(sessionId);

  if (!session) {
    logger.error('Session not found', { sessionId });
    throw new AppError({
      description: 'Session not found.',
      httpCode: HttpCode.NOT_FOUND,
    });
  }

  if (sessionTranscript?.status_new === TranscriptStatus.COMPLETE) {
    logger.info('Session transcript is already completed, aborting', {
      sessionId,
    });
    return;
  }

  if (sessionTranscript?.status_new === TranscriptStatus.PROCESSING) {
    if (sessionTranscript.transcriptExternalId) {
      logger.info('Checking status of in-progress transcript', {
        sessionId,
        transcriptExternalId: sessionTranscript.transcriptExternalId,
      });
      const transcript = await client.transcripts.get(
        sessionTranscript.transcriptExternalId,
      );

      if (transcript.status === 'completed' || transcript.status === 'error') {
        logger.info('Found completed transcript for this session', {
          sessionId,
          transcriptStatus: transcript.status,
        });
        await processCompletedTranscript(
          session.campaignId,
          sessionId,
          userId,
          transcript.id,
        );
        return;
      }
    }

    logger.info('Session transcript is already processing, aborting', {
      sessionId,
    });
    return;
  }

  if (sessionTranscript?.status_new === TranscriptStatus.FAILED) {
    logger.info('Session transcript has failed, retrying', { sessionId });

    sessionTranscript = await prisma.sessionTranscription.update({
      where: { sessionId },
      data: { status_new: TranscriptStatus.PROCESSING },
    });
  }

  if (!sessionTranscript) {
    logger.info('Creating new session transcript record', {
      sessionId,
      userId,
    });
    sessionTranscript = await prisma.sessionTranscription.create({
      data: {
        sessionId,
        userId,
        status_new: TranscriptStatus.PROCESSING,
      },
    });
  }

  logger.info('Returning session transcript', {
    sessionId,
    status: sessionTranscript.status_new,
  });
  return sessionTranscript;
};
