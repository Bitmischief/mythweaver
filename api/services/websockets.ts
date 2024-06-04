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
  Error = 'error',
  ConjurationCreated = 'conjuration-created',
  ImageCreated = 'image-created',
  ImageUpscaled = 'image-upscaled',
  ImageGenerationDone = 'image-generation-done',
  ImageUpscalingDone = 'image-upscaling-done',
  SessionUpdated = 'session-updated',
  SessionCompleted = 'session-completed',
  SessionImageUpdated = 'session-image-updated',
  UserImageCreditCountUpdated = 'user-image-credit-count-updated',
  UserArtistContributionsUpdated = 'user-artist-contributions-updated',
  UserConjurationCountUpdated = 'user-conjuration-count-updated',
  TranscriptionStarted = 'transcription-started',
  TranscriptionComplete = 'transcription-complete',
  PrimaryImageSet = 'primary-image-set',
  ImageGenerationTimeout = 'image-generation-timeout',
}

export interface WebSocketContext {
  userId?: number;
  sessionId?: number;
  imageId?: number;
  conjurationId?: number;
}
