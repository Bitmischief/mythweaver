import axios, { AxiosResponse } from 'axios';
import { prisma } from '../lib/providers/prisma';
import { sendWebsocketMessage, WebSocketEvent } from './websockets';

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
    await sendWebsocketMessage(
      request.userId,
      WebSocketEvent.TranscriptionError,
      {
        message: 'User not found.',
      },
    );

    throw new Error('User not found');
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
    await sendWebsocketMessage(request.userId, WebSocketEvent.ImageError, {
      message:
        'There was an error while making the transcription request. Please try again.',
    });

    throw new Error(
      'There was an error while making the transcription request. Please try again.',
    );
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
