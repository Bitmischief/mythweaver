import { sessionTranscriptQueue } from "@/modules/sessions/sessionTranscript.worker";
import { conjureQueue, GenerateConjurationWorker } from '@/modules/conjurations/workers/generateConjuration.worker';
import {
  CampaignContextWorker,
  indexCampaignContextQueue,
} from '@/modules/context/workers/campaignContext.worker';
import { DailyCampaignContextWorker } from '@/modules/context/workers/dailyCampaignContext.worker';
import { MythWeaverImageWorker } from '@/modules/images/mythweaverImage.worker';
import { SessionTranscriptWorker } from '@/modules/sessions/sessionTranscript.worker';
import { EndTrialWorker } from '@/modules/users/workers/endTrial.worker';
import { ExpiredSubscriptionWorker } from '@/modules/users/workers/expiredSubscription.worker';
import { SubscriptionPlanUpdateWorker } from '@/modules/users/workers/subscriptionPlanUpdate.worker';
import { InjectionMode, asClass, asValue, createContainer } from 'awilix';
import { Logger } from '../logging/logger';
import { WebSocketProvider } from '@/providers/websocketProvider';
import { RunPodProvider } from '@/providers/runPod';
import { AssemblyAIProvider } from '@/providers/assemblyAI';
import { StripeProvider } from '@/providers/stripe';
import { OpenAIProvider } from '@/providers/llms/openAIProvider';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';
import { CampaignDataProvider } from '@/modules/campaigns/campaign.dataprovider';
import { CampaignService } from '@/modules/campaigns/campaign.service';
import { ContextService } from '@/modules/context/context.service';
import { ConjurationsService } from '@/modules/conjurations/conjurations.service';
import { ImagesDataProvider } from '@/modules/images/images.dataprovider';
import { CompletedImageService } from '@/modules/images/completedImage.service';
import { StorageProvider } from '@/providers/storageProvider';
import { CreditsProvider } from '@/providers/creditsProvider';
import { EmailProvider } from '@/providers/emailProvider';
import { processTagsQueue } from '@/modules/conjurations/workers/tags.worker';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

container.register({
  // providers
  logger: asClass(Logger).singleton(),
  webSocketProvider: asClass(WebSocketProvider).singleton(),
  llmProvider: asClass(OpenAIProvider).singleton(),
  runPodProvider: asClass(RunPodProvider).singleton(),
  stripeProvider: asClass(StripeProvider).singleton(),
  assemblyAIProvider: asClass(AssemblyAIProvider).singleton(),
  storageProvider: asClass(StorageProvider).singleton(),
  creditsProvider: asClass(CreditsProvider).singleton(),
  emailProvider: asClass(EmailProvider).singleton(),

  // queues
  indexCampaignContextQueue: asValue(indexCampaignContextQueue),
  conjureQueue: asValue(conjureQueue),
  sessionTranscriptQueue: asValue(sessionTranscriptQueue),
  processTagsQueue: asValue(processTagsQueue),

  // data providers
  conjurationsDataProvider: asClass(ConjurationsDataProvider).singleton(),
  campaignDataProvider: asClass(CampaignDataProvider).singleton(),
  imagesDataProvider: asClass(ImagesDataProvider).singleton(),

  // services
  conjurationsService: asClass(ConjurationsService).singleton(),
  campaignService: asClass(CampaignService).singleton(),
  contextService: asClass(ContextService).singleton(),
  completedImageService: asClass(CompletedImageService).singleton(),

  // workers
  generateConjurationWorker: asClass(GenerateConjurationWorker).singleton(),
  dailyCampaignContextWorker: asClass(DailyCampaignContextWorker).singleton(),
  indexCampaignContextWorker: asClass(CampaignContextWorker).singleton(),
  mythweaverImageWorker: asClass(MythWeaverImageWorker).singleton(),
  endTrialWorker: asClass(EndTrialWorker).singleton(),
  expiredSubscriptionWorker: asClass(ExpiredSubscriptionWorker).singleton(),
  subscriptionPlanUpdateWorker: asClass(
    SubscriptionPlanUpdateWorker,
  ).singleton(),
  sessionTranscriptWorker: asClass(SessionTranscriptWorker).singleton(),
});

export default container;
