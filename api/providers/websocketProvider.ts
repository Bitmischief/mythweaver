import Pusher from 'pusher';

export enum WebSocketEvent {
  Error = 'error',
  ConjurationCreated = 'conjuration-created',
  ConjurationError = 'conjuration-error',
  ImageCreated = 'image-created',
  ImageUpscaled = 'image-upscaled',
  ImageGenerationDone = 'image-generation-done',
  ImageUpscalingDone = 'image-upscaling-done',
  SessionUpdated = 'session-updated',
  SessionCompleted = 'session-completed',
  SessionImageUpdated = 'session-image-updated',
  SessionTranscriptCreated = 'session-transcript-created',
  UserImageCreditCountUpdated = 'user-image-credit-count-updated',
  UserArtistContributionsUpdated = 'user-artist-contributions-updated',
  UserConjurationCountUpdated = 'user-conjuration-count-updated',
  TranscriptionStarted = 'transcription-started',
  TranscriptionComplete = 'transcription-complete',
  PrimaryImageSet = 'primary-image-set',
  ImageGenerationTimeout = 'image-generation-timeout',
  ImageGenerationError = 'image-generation-error',
  ImageFiltered = 'image-filtered',
  CollectionConjurationMoved = 'collection-conjuration-moved',
  CollectionMoved = 'collection-moved',
  CampaignFileUploaded = 'campaign-file-uploaded',
  CampaignFileProcessed = 'campaign-file-processed',
  ImageEdited = 'image-edited',
  ModelGenerationStarted = 'MODEL_GENERATION_STARTED',
  ModelGenerationCompleted = 'MODEL_GENERATION_COMPLETED',
  ImageUrlUpdated = 'image-url-updated',
  ImageGenerationUpdate = 'image-generation-update',
}

export interface WebSocketContext {
  userId?: number;
  sessionId?: number;
  imageId?: number;
  conjurationId?: number;
}

export class WebSocketProvider {
  private pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID as string,
      key: process.env.PUSHER_KEY as string,
      secret: process.env.PUSHER_SECRET as string,
      cluster: process.env.PUSHER_CLUSTER as string,
      useTLS: true,
    });
  }

  async sendMessage(
    userId: number,
    event: string,
    message: any,
  ): Promise<void> {
    await this.pusher.trigger(userId.toString(), event, message);
  }
}

export default new WebSocketProvider();
