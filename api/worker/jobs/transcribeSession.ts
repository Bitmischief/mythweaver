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
import { Session, TranscriptStatus } from '@prisma/client';
import logger from '../../lib/logger';
import { SpeechModel } from 'assemblyai/src/types/openapi.generated';
import { sleep } from 'openai/core';
import { ProcessedTranscript } from '../../dataAccess/transcript';
import { generateText } from '../../services/textGeneration';
import { config } from '../config';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string,
});

export const sessionTranscriptionQueue = new Queue<TranscribeSessionEvent>(
  'transcribe-session',
  config,
);

sessionTranscriptionQueue.process(async (job, done) => {
  logger.info('Processing session transcript context job', job.data);

  try {
    await transcribeSession(job.data);
    logger.info('Completed processing session transcript job', job.data);
    done();
  } catch (err) {
    logger.error('Error processing session transcript job!', err);
    done(new Error('Error processing session transcript job!'));
  }
});

export const transcribeSession = async (request: TranscribeSessionEvent) => {
  const { sessionId, userId } = request;

  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
  });

  if (!session) {
    throw new AppError({
      description: 'Session not found.',
      httpCode: HttpCode.NOT_FOUND,
    });
  }

  if (!session.audioUri) {
    throw new AppError({
      description: 'Session audio not found.',
      httpCode: HttpCode.NOT_FOUND,
    });
  }

  await retry(async () => {
    try {
      await processSessionTranscription(userId, session);
    } catch (error) {
      logger.error(
        'Encountered an error transcribing session audio.',
        {},
        error,
      );
      await prisma.sessionTranscription.update({
        where: {
          sessionId: sessionId,
        },
        data: {
          status_new: TranscriptStatus.FAILED,
        },
      });
    }
  });
};

const processSessionTranscription = async (
  userId: number,
  session: Session,
) => {
  const sessionTranscript = await createOrUpdateSessionTranscriptRecord(
    session.id,
    userId,
  );

  if (!sessionTranscript) {
    logger.info('Session transcript already processed or processing.');
    return;
  }

  if (!session.audioUri) {
    throw new AppError({
      description: 'Session audio not found.',
      httpCode: HttpCode.NOT_FOUND,
    });
  }

  // Request parameters
  const data = {
    audio:
      session.audioUri?.indexOf('https') === -1
        ? `https://${session.audioUri}`
        : session.audioUri,
    speaker_labels: true,
    auto_highlights: true,
    speech_model: 'nano' as SpeechModel,
  };

  let transcript: Transcript;
  try {
    transcript = await client.transcripts.transcribe(data);
  } catch (error) {
    logger.error('Error transcribing session audio.', {}, error);
    throw new AppError({
      description: 'Error transcribing session audio.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  }

  await prisma.sessionTranscription.update({
    where: {
      sessionId: sessionTranscript.sessionId,
    },
    data: {
      status_new: TranscriptStatus.PROCESSING,
      transcriptExternalId: transcript.id,
    },
  });

  await sendWebsocketMessage(userId, WebSocketEvent.TranscriptionStarted, {
    sessionId: session.id,
  });

  await pollForTranscript(transcript.id);

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
  const transcript = await client.transcripts.get(transcriptId);

  if (transcript.status === 'error') {
    throw new AppError({
      description: 'Error transcribing session audio.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  }

  const recapPrompt =
    "Provide a thorough recap of the transcript. For every 30 minutes of audio, there should be at least a paragraph in the recap to summarize. Respond with just the summary and don't include a preamble or introduction.";

  const { response: recap } = await client.lemur.task({
    transcript_ids: [transcript.id],
    prompt: recapPrompt,
    context: 'This is a tabletop roleplaying game session',
    final_model: 'anthropic/claude-3-5-sonnet',
  });

  const summaryPrompt =
    "Provide an 8 sentence summary of the transcript. Respond with just the summary and don't include a preamble or introduction.";

  const { response: summary } = await client.lemur.task({
    transcript_ids: [transcript.id],
    prompt: summaryPrompt,
    context: 'This is a tabletop roleplaying game session',
    final_model: 'anthropic/claude-3-5-sonnet',
  });

  const { sentences } = await client.transcripts.sentences(transcript.id);
  const { paragraphs } = await client.transcripts.paragraphs(transcript.id);

  let fullTranscript: ProcessedTranscript = {
    sentences,
    paragraphs,
    recap,
    summary,
  };

  fullTranscript = await postprocessTranscript(campaignId, fullTranscript);

  await prisma.sessionTranscription.update({
    where: {
      sessionId,
    },
    data: {
      transcript: fullTranscript as any,
      transcriptExternalId: transcript.id,
      sentences,
      paragraphs,
    },
  });

  await prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      summary: fullTranscript.summary,
      recap: fullTranscript.recap,
    },
  });

  await sendWebsocketMessage(userId, WebSocketEvent.TranscriptionComplete, {
    sessionId: sessionId,
    summary: fullTranscript.summary,
    recap: fullTranscript.recap,
  });
};

const postprocessTranscript = async (
  campaignId: number,
  transcript: ProcessedTranscript,
) => {
  const updatedSummary = await generateText(
    campaignId,
    `Review the provided tabletop roleplaying game 
  session summary and look for any misspelt character names, location names or other names of specific content in my 
  game that might be misspelt. Respond with just the summary and don't include a preamble, introduction, or the corrections made.. If there are 
  no corrections to be made, please return the summary as is. Here is the original summary: ${transcript.summary}`,
  );

  const updatedRecap = await generateText(
    campaignId,
    `Review the provided tabletop roleplaying game 
  session recap and look for any misspelt character names, location names or other names of specific content in my 
  game that might be misspelt. Respond with just the recap and don't include a preamble, introduction, or the corrections made. If there are 
  no corrections to be made, please return the recap as is. Here is the 
  original recap: ${transcript.recap}`,
  );

  return {
    ...transcript,
    summary: updatedSummary,
    recap: updatedRecap,
  };
};

const pollForTranscript = async (transcriptId: string) => {
  const pollingInterval = 3000;
  const maxPollDuration = 60 * 60 * 1000;
  let iterations = 0;

  do {
    const transcript = await client.transcripts.get(transcriptId);

    if (transcript.status === 'completed' || transcript.status === 'error') {
      return transcript;
    }

    iterations++;
    await sleep(pollingInterval);
  } while (iterations * pollingInterval < maxPollDuration);
};

const createOrUpdateSessionTranscriptRecord = async (
  sessionId: number,
  userId: number,
) => {
  let sessionTranscript = await prisma.sessionTranscription.findUnique({
    where: {
      sessionId,
    },
  });

  const session = await getSession(sessionId);

  if (!session) {
    throw new AppError({
      description: 'Session not found.',
      httpCode: HttpCode.NOT_FOUND,
    });
  }

  if (sessionTranscript?.status_new === TranscriptStatus.COMPLETE) {
    logger.info('This session transcript is already completed, aborting.');
    return;
  }

  if (sessionTranscript?.status_new === TranscriptStatus.PROCESSING) {
    if (sessionTranscript.transcriptExternalId) {
      const transcript = await client.transcripts.get(
        sessionTranscript.transcriptExternalId,
      );

      if (transcript.status === 'completed' || transcript.status === 'error') {
        logger.info('Found completed transcript for this session.');
        await processCompletedTranscript(
          session.campaignId,
          sessionId,
          userId,
          transcript.id,
        );
        return;
      }
    }

    logger.info('This session transcript is already processing, aborting.');
    return;
  }

  if (sessionTranscript?.status_new === TranscriptStatus.FAILED) {
    logger.info('This session transcript has failed, retrying.');

    sessionTranscript = await prisma.sessionTranscription.update({
      where: {
        sessionId,
      },
      data: {
        status_new: TranscriptStatus.PROCESSING,
      },
    });
  }

  if (!sessionTranscript) {
    sessionTranscript = await prisma.sessionTranscription.create({
      data: {
        sessionId,
        userId,
        status_new: TranscriptStatus.PROCESSING,
      },
    });
  }

  return sessionTranscript;
};
