import { AssemblyAI } from 'assemblyai';
import retry from 'async-await-retry';
import { TranscribeSessionEvent } from '../../dataAccess/sessions';
import { prisma } from '../../lib/providers/prisma';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string,
});

export const transcribeSession = async (request: TranscribeSessionEvent) => {
  const { sessionId } = request;

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
    // Request parameters
    const data = {
      audio: session.audioUri || '',
      speaker_labels: true,
      auto_highlights: true,
    };

    const transcript = await client.transcripts.transcribe(data);

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

    await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        transcript: transcript.utterances as any,
        transcriptExternalId: transcript.id,
        summary,
        recap,
      },
    });

    await sendWebsocketMessage(
      session.userId,
      WebSocketEvent.SessionTranscriptCreated,
      {
        sessionId: sessionId,
        transcript: transcript.utterances,
        summary: summary,
      },
    );
  });
};
