import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { CampaignFilesController } from '@/modules/campaigns/files/campaignFiles.controller';
import { CampaignFilesService } from '@/modules/campaigns/files/campaignFiles.service';
import { CampaignFilesDataProvider } from '@/modules/campaigns/files/campaignFiles.dataprovider';
import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';
import { useLogger } from '@/lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  campaignFilesController: asClass(CampaignFilesController).scoped(),
  campaignFilesService: asClass(CampaignFilesService).scoped(),
  campaignFilesDataProvider: asClass(CampaignFilesDataProvider).scoped(),
  membersDataProvider: asClass(MembersDataProvider).scoped(),
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
