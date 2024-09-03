import { AssemblyAI, Transcript } from 'assemblyai';
import retry from 'async-await-retry';
import { TranscribeSessionEvent } from '../../dataAccess/sessions';
import { prisma } from '../../lib/providers/prisma';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';
import { TranscriptStatus } from '@prisma/client';
import logger from '../../lib/logger';
import { SpeechModel } from 'assemblyai/src/types/openapi.generated';
import { sleep } from 'openai/core';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string,
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

  try {
    await retry(async () => {
      const sessionTranscript = await createOrUpdateSessionTranscriptRecord(
        sessionId,
        userId,
      );

      if (!sessionTranscript) {
        logger.info('Session transcript already processed or processing.');
        return;
      }

      // Request parameters
      const data = {
        audio: session.audioUri || '',
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

      await pollForTranscript(transcript.id);

      await processCompletedTranscript(sessionId, userId, transcript.id);
    });
  } catch (error) {
    logger.error('Encountered an error transcribing session audio.', {}, error);
    await prisma.sessionTranscription.update({
      where: {
        sessionId: sessionId,
      },
      data: {
        status_new: TranscriptStatus.FAILED,
      },
    });
  }
};

const processCompletedTranscript = async (
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

  const recapPrompt = 'Provide an 8-12 sentence recap of the transcript.';

  const { response: recap } = await client.lemur.task({
    transcript_ids: [transcript.id],
    prompt: recapPrompt,
  });

  const summaryPrompt = 'Provide a 4 sentence summary of the transcript.';

  const { response: summary } = await client.lemur.task({
    transcript_ids: [transcript.id],
    prompt: summaryPrompt,
  });

  const { sentences } = await client.transcripts.sentences(transcript.id);
  const { paragraphs } = await client.transcripts.paragraphs(transcript.id);

  await prisma.sessionTranscription.update({
    where: {
      sessionId,
    },
    data: {
      status_new: TranscriptStatus.COMPLETE,
      transcript: {
        ...transcript,
        utterances: undefined,
        sentences,
        paragraphs,
      },
      transcriptExternalId: transcript.id,
    },
  });

  await prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      summary,
      recap,
    },
  });

  await sendWebsocketMessage(userId, WebSocketEvent.SessionTranscriptCreated, {
    sessionId: sessionId,
    transcript: transcript.utterances,
    summary: summary,
  });
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
        await processCompletedTranscript(sessionId, userId, transcript.id);
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
