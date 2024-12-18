import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { CampaignsController } from '@/modules/campaigns/campaigns.controller';
import { CampaignsService } from '@/modules/campaigns/campaigns.service';
import { CampaignsDataProvider } from '@/modules/campaigns/campaigns.dataprovider';
import { CollectionsDataProvider } from '@/modules/collections/collections.dataprovider';
import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { CharactersDataProvider } from '@/modules/campaigns/characters/characters.dataprovider';
import { useLogger } from '@/lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { EmailProvider } from '@/providers/emailProvider';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  campaignsController: asClass(CampaignsController).scoped(),
  campaignsService: asClass(CampaignsService).scoped(),
  campaignsDataProvider: asClass(CampaignsDataProvider).scoped(),
  collectionsDataProvider: asClass(CollectionsDataProvider).scoped(),
  membersDataProvider: asClass(MembersDataProvider).scoped(),
  usersDataProvider: asClass(UsersDataProvider).scoped(),
  charactersDataProvider: asClass(CharactersDataProvider).scoped(),
  emailProvider: asClass(EmailProvider).singleton(),
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
