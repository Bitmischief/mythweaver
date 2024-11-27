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
  SessionUpdated = 'session-updated',
  SessionCompleted = 'session-completed',
  SessionImageUpdated = 'session-image-updated',
  UserImageCreditCountUpdated = 'user-image-credit-count-updated',
  UserArtistContributionsUpdated = 'user-artist-contributions-updated',
  UserConjurationCountUpdated = 'user-conjuration-count-updated',
  TranscriptionStarted = 'transcription-started',
  TranscriptionError = 'transcription-error',
  TranscriptionComplete = 'transcription-complete',
  PrimaryImageSet = 'primary-image-set',
  ImageGenerationTimeout = 'image-generation-timeout',
  ImageGenerationError = 'image-generation-error',
  Error = 'error',
  CollectionConjurationMoved = 'collection-conjuration-moved',
  CollectionMoved = 'collection-moved',
  CampaignFileUploaded = 'campaign-file-uploaded',
  CampaignFileProcessed = 'campaign-file-processed',
  ImageEdited = 'image-edited',
  ModelGenerationStarted = 'MODEL_GENERATION_STARTED',
  ModelGenerationCompleted = 'MODEL_GENERATION_COMPLETED',
  ImageUrlUpdated = 'image-url-updated',
  ImageInpaintError = 'image-inpaint-error',
  ImageOutpaintError = 'image-outpaint-error',
  ImageEraseError = 'image-erase-error',
}
