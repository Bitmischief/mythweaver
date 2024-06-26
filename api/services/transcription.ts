import axios, { AxiosResponse } from 'axios';
import { prisma } from '../lib/providers/prisma';
import { sendWebsocketMessage, WebSocketEvent } from './websockets';
import { getClient } from '../lib/providers/openai';
import { AppError, ErrorType, HttpCode } from '../lib/errors/AppError';

const openai = getClient();

const transcriptionServiceDomain = process.env.TRANSCRIPTION_SERVICE_DOMAIN;
const serviceToken = process.env.X_SERVICE_TOKEN;

interface TranscriptionResponse {
  call_id: string;
}

export interface TranscriptionRequest {
  userId: number;
  sessionId: number;
  audioUri: string;
  requestId: string;
}

export const transcribeSessionAudio = async (request: TranscriptionRequest) => {
  if (!serviceToken)
    throw new Error('Missing transcription service api token.');

  const user = await prisma.user.findUnique({
    where: {
      id: request.userId,
    },
  });

  if (!user) {
    throw new AppError({
      description: 'Unable to find user.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      websocket: {
        userId: request.userId,
        errorCode: ErrorType.TranscriptionError,
        context: {
          userId: request.userId,
          sessionId: request.sessionId,
        },
      },
    });
  }

  // todo: eventually check if user.plan === 'PRO'
  let response: AxiosResponse<TranscriptionResponse>;

  try {
    response = await axios.post(
      `${transcriptionServiceDomain}/api/transcribe`,
      {
        session_id: request.sessionId,
        session_audio_url: request.audioUri,
      },
      {
        headers: {
          'x-mw-token': serviceToken,
          'x-request-id': request.requestId,
        },
      },
    );
  } catch (err) {
    throw new AppError({
      description:
        'There was an error while making the transcription request. Please try again.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      websocket: {
        userId: request.userId,
        errorCode: ErrorType.TranscriptionError,
        context: {
          userId: request.userId,
          sessionId: request.sessionId,
        },
      },
    });
  }

  if (response.data) {
    await sendWebsocketMessage(
      request.userId,
      WebSocketEvent.TranscriptionStarted,
      'Transcription has started, this process can take  10 - 20 minutes to complete for large audio files. Please check back in a bit.',
    );
  } else {
    return undefined;
  }

  return response;
};

export const recapTranscription = async (transcription: string) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant and professional DM/GM who is a master story teller and is knowledgeable in all things TTRPG.',
      },
      {
        role: 'user',
        content: `Given the following transcription of a TTRPG session, please tell me the highlights of what happened. Please respond only with the recap and no other text. Only include the information that would be relevant for players to remember for future sessions: ${transcription}`,
      },
    ],
  });

  return response.choices[0]?.message?.content || '';
};
