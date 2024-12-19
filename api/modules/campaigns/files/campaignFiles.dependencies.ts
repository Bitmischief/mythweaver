import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { CampaignFilesController } from '@/modules/campaigns/files/campaignFiles.controller';
import { CampaignFilesService } from '@/modules/campaigns/files/campaignFiles.service';
import { CampaignFilesDataProvider } from '@/modules/campaigns/files/campaignFiles.dataprovider';
import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';
import { useLogger } from '@/modules/core/logging/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { CampaignContextWorker } from '@/modules/context/workers/campaignContext.worker';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

container.register({
  campaignFilesController: asClass(CampaignFilesController).scoped(),
  campaignFilesService: asClass(CampaignFilesService).scoped(),
  campaignFilesDataProvider: asClass(CampaignFilesDataProvider).scoped(),
  membersDataProvider: asClass(MembersDataProvider).scoped(),
  indexCampaignContextWorker: asClass(CampaignContextWorker).singleton(),
  logger: asFunction(useLogger).scoped(),
});

export const injectDependencies = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.container = container.createScope();
  next();
};
