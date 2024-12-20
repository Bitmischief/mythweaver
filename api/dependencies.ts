import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { Logger } from '@/modules/core/logging/logger';
import { CampaignDataProvider as CampaignDataProvider } from '@/modules/campaigns/campaign.dataprovider';
import { WebSocketProvider } from '@/providers/websocketProvider';
import { ArtistsDataProvider } from '@/modules/artists/artists.dataprovider';
import { ArtistsService } from '@/modules/artists/artists.service';
import { ArtistsController } from '@/modules/artists/artists.controller';
import { BillingService } from '@/modules/billing/billing.service';
import { BillingDataProvider } from '@/modules/billing/billing.dataprovider';
import { BillingController } from '@/modules/billing/billing.controller';
import { CampaignService as CampaignService } from '@/modules/campaigns/campaign.service';
import { CampaignController as CampaignController } from '@/modules/campaigns/campaign.controller';
import { CampaignConjurationsDataProvider } from '@/modules/campaigns/conjurations/campaignConjurations.dataprovider';
import { CampaignConjurationsController } from '@/modules/campaigns/conjurations/campaignConjurations.controller';
import { CampaignConjurationsService } from '@/modules/campaigns/conjurations/campaignConjurations.service';
import { CampaignFilesDataProvider } from '@/modules/campaigns/files/campaignFiles.dataprovider';
import { CampaignFilesController } from '@/modules/campaigns/files/campaignFiles.controller';
import { CampaignFilesService } from '@/modules/campaigns/files/campaignFiles.service';
import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';
import { MembersService } from '@/modules/campaigns/members/members.service';
import { MembersController } from '@/modules/campaigns/members/members.controller';
import { CollectionsDataProvider } from '@/modules/collections/collections.dataprovider';
import { CollectionsController } from '@/modules/collections/collections.controller';
import { CollectionsService } from '@/modules/collections/collections.service';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';
import { ConjurationsService } from '@/modules/conjurations/conjurations.service';
import { ConjurationsController } from '@/modules/conjurations/conjurations.controller';
import { ConjurationsRelationshipsDataProvider } from '@/modules/conjurations/relationships/relationships.dataprovider';
import { ConjurationsRelationshipsController } from '@/modules/conjurations/relationships/relationships.controller';
import { ContextService } from '@/modules/context/context.service';
import { ContextDataProvider } from '@/modules/context/context.dataprovider';
import { GeneratorsService } from '@/modules/generators/generators.service';
import { GeneratorsController } from '@/modules/generators/generators.controller';
import { GeneratorsDataProvider } from '@/modules/generators/generators.dataprovider';
import { ImageModelsDataProvider } from '@/modules/imageModels/imageModels.dataprovider';
import { ImageModelsService } from '@/modules/imageModels/imageModels.service';
import { ImageModelsController } from '@/modules/imageModels/imageModels.controller';
import { ImagesService } from '@/modules/images/images.service';
import { ImagesController } from '@/modules/images/images.controller';
import { ImagesDataProvider } from '@/modules/images/images.dataprovider';
import { CompletedImageService } from '@/modules/images/completedImage.service';
import { IntegrationsService } from '@/modules/integrations/integrations.service';
import { IntegrationsController } from '@/modules/integrations/integrations.controller';
import { RpgSystemsDataProvider } from '@/modules/rpgSystems/rpgSystems.dataprovider';
import { RpgSystemsService } from '@/modules/rpgSystems/rpgSystems.service';
import { RpgSystemsController } from '@/modules/rpgSystems/rpgSystems.controller';
import { SessionsController } from '@/modules/sessions/sessions.controller';
import { SessionsDataProvider } from '@/modules/sessions/sessions.dataprovider';
import { SessionsService } from '@/modules/sessions/sessions.service';
import { UsersService } from '@/modules/users/users.service';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { UsersController } from '@/modules/users/users.controller';
import { OpenAIProvider } from '@/providers/llms/openAIProvider';
import { StorageProvider } from '@/providers/storageProvider';
import { CreditsProvider } from '@/providers/creditsProvider';
import { EmailProvider } from '@/providers/emailProvider';
import { StripeProvider } from '@/providers/stripe';
import { RunPodProvider } from '@/providers/runPod';
import { AssemblyAIProvider } from '@/providers/assemblyAI';
import { TranscriptionService } from '@/modules/sessions/transcription.service';
import { indexCampaignContextQueue } from './modules/context/workers/campaignContext.worker';
import { conjureQueue } from './modules/conjurations/workers/generateConjuration.worker';
import { sessionTranscriptQueue } from './modules/sessions/sessionTranscript.worker';
import { ConjurationsRelationshipsService } from './modules/conjurations/relationships/relationships.service';
import { processTagsQueue } from './modules/conjurations/workers/tags.worker';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

container.register({
  // providers
  storageProvider: asClass(StorageProvider).scoped(),
  creditsProvider: asClass(CreditsProvider).scoped(),
  emailProvider: asClass(EmailProvider).scoped(),
  logger: asClass(Logger).scoped(),
  webSocketProvider: asClass(WebSocketProvider).scoped(),
  llmProvider: asClass(OpenAIProvider).scoped(),
  runPodProvider: asClass(RunPodProvider).scoped(),
  stripeProvider: asClass(StripeProvider).scoped(),
  assemblyAIProvider: asClass(AssemblyAIProvider).scoped(),

  // queues
  indexCampaignContextQueue: asValue(indexCampaignContextQueue),
  conjureQueue: asValue(conjureQueue),
  sessionTranscriptQueue: asValue(sessionTranscriptQueue),
  processTagsQueue: asValue(processTagsQueue),

  // artists
  artistsDataProvider: asClass(ArtistsDataProvider).scoped(),
  artistsService: asClass(ArtistsService).scoped(),
  artistsController: asClass(ArtistsController).scoped(),

  // billing
  billingDataProvider: asClass(BillingDataProvider).scoped(),
  billingService: asClass(BillingService).scoped(),
  billingController: asClass(BillingController).scoped(),

  // campaigns
  campaignDataProvider: asClass(CampaignDataProvider).scoped(),
  campaignService: asClass(CampaignService).scoped(),
  campaignController: asClass(CampaignController).scoped(),

  // campaign conjurations
  campaignConjurationsDataProvider: asClass(
    CampaignConjurationsDataProvider,
  ).scoped(),
  campaignConjurationsService: asClass(CampaignConjurationsService).scoped(),
  campaignConjurationsController: asClass(
    CampaignConjurationsController,
  ).scoped(),

  // campaign files
  campaignFilesDataProvider: asClass(CampaignFilesDataProvider).scoped(),
  campaignFilesService: asClass(CampaignFilesService).scoped(),
  campaignFilesController: asClass(CampaignFilesController).scoped(),

  // campaign members
  membersDataProvider: asClass(MembersDataProvider).scoped(),
  membersService: asClass(MembersService).scoped(),
  membersController: asClass(MembersController).scoped(),

  // collections
  collectionsDataProvider: asClass(CollectionsDataProvider).scoped(),
  collectionsService: asClass(CollectionsService).scoped(),
  collectionsController: asClass(CollectionsController).scoped(),

  // conjurations
  conjurationsDataProvider: asClass(ConjurationsDataProvider).scoped(),
  conjurationsService: asClass(ConjurationsService).scoped(),
  conjurationsController: asClass(ConjurationsController).scoped(),

  // relationships
  relationshipsDataProvider: asClass(
    ConjurationsRelationshipsDataProvider,
  ).scoped(),
  relationshipsService: asClass(ConjurationsRelationshipsService).scoped(),
  relationshipsController: asClass(
    ConjurationsRelationshipsController,
  ).scoped(),

  // context
  contextDataProvider: asClass(ContextDataProvider).scoped(),
  contextService: asClass(ContextService).scoped(),

  // generators
  generatorsController: asClass(GeneratorsController).scoped(),
  generatorsService: asClass(GeneratorsService).scoped(),
  generatorsDataProvider: asClass(GeneratorsDataProvider).scoped(),

  // image models
  imageModelsController: asClass(ImageModelsController).scoped(),
  imageModelsService: asClass(ImageModelsService).scoped(),
  imageModelsDataProvider: asClass(ImageModelsDataProvider).scoped(),

  // images
  imagesController: asClass(ImagesController).scoped(),
  imagesService: asClass(ImagesService).scoped(),
  imagesDataProvider: asClass(ImagesDataProvider).scoped(),
  completedImageService: asClass(CompletedImageService).scoped(),

  // integrations
  integrationsController: asClass(IntegrationsController).scoped(),
  integrationsService: asClass(IntegrationsService).scoped(),

  // rpg systems
  rpgSystemsController: asClass(RpgSystemsController).scoped(),
  rpgSystemsService: asClass(RpgSystemsService).scoped(),
  rpgSystemsDataProvider: asClass(RpgSystemsDataProvider).scoped(),

  // sessions
  sessionsController: asClass(SessionsController).scoped(),
  sessionsService: asClass(SessionsService).scoped(),
  sessionsDataProvider: asClass(SessionsDataProvider).scoped(),
  transcriptionService: asClass(TranscriptionService).scoped(),

  // users
  usersController: asClass(UsersController).scoped(),
  usersService: asClass(UsersService).scoped(),
  usersDataProvider: asClass(UsersDataProvider).scoped(),
});

export default container;
