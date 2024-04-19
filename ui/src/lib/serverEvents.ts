import Pusher from 'pusher-js';
import { isProduction } from '@/lib/util.ts';

if (!isProduction) {
  Pusher.logToConsole = true;
}

const pusherAppKey = import.meta.env.VITE_PUSHER_APP_KEY;
export const pusher = new Pusher(pusherAppKey, {
  cluster: 'us3',
});

export enum ServerEvent {
  ConjurationCreated = 'conjuration-created',
  ConjurationError = 'conjuration-error',
  ImageCreated = 'image-created',
  ImageUpscaled = 'image-upscaled',
  ImageFiltered = 'image-filtered',
  ImagePromptRephrased = 'image-prompt-rephrased',
  ImageError = 'image-error',
  ImageGenerationDone = 'image-generation-done',
  ImageUpscalingDone = 'image-upscaling-done',
  SessionUpdated = 'session-updated',
  SessionCompleted = 'session-completed',
  SessionImageUpdated = 'session-image-updated',
  UserImageCreditCountUpdated = 'user-image-credit-count-updated',
  UserConjurationCountUpdated = 'user-conjuration-count-updated',
  TranscriptionStarted = 'transcription-started',
  TranscriptionError = 'transcription-error',
  TranscriptionComplete = 'transcription-complete',
}
