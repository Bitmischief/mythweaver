import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignsDataProvider } from './campaigns.dataprovider';
import { CollectionsDataProvider } from '../collections/collections.dataprovider';
import { MembersDataProvider } from './members/members.dataprovider';
import { UsersDataProvider } from '../users/users.dataprovider';
import { CharactersDataProvider } from './characters/characters.dataprovider';
import { useLogger } from '../../lib/loggingMiddleware';
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
