import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionsDataProvider } from './sessions.dataprovider';
import { MembersDataProvider } from '../campaigns/members/members.dataprovider';
import { UsersDataProvider } from '../users/users.dataprovider';
import { CampaignsDataProvider } from '../campaigns/campaigns.dataprovider';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  sessionsController: asClass(SessionsController).scoped(),
  sessionsService: asClass(SessionsService).scoped(),
  sessionsDataProvider: asClass(SessionsDataProvider).scoped(),
  membersDataProvider: asClass(MembersDataProvider).scoped(),
  usersDataProvider: asClass(UsersDataProvider).scoped(),
  campaignsDataProvider: asClass(CampaignsDataProvider).scoped(),
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
