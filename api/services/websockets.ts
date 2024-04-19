import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID as string,
  key: process.env.PUSHER_KEY as string,
  secret: process.env.PUSHER_SECRET as string,
  cluster: process.env.PUSHER_CLUSTER as string,
  useTLS: true,
});

export const sendWebsocketMessage = async (
  userId: number,
  event: string,
  message: any,
) => {
  await pusher.trigger(userId.toString(), event, message);
};

export enum WebSocketEvent {
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
