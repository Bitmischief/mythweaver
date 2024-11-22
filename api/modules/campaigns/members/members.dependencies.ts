import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { MembersDataProvider } from './members.dataprovider';
import { useLogger } from '../../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { CampaignsDataProvider } from '../campaigns.dataprovider';
import { UsersDataProvider } from '../../users/users.dataprovider';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  membersController: asClass(MembersController).scoped(),
  membersService: asClass(MembersService).scoped(),
  membersDataProvider: asClass(MembersDataProvider).scoped(),
  campaignsDataProvider: asClass(CampaignsDataProvider).scoped(),
  usersDataProvider: asClass(UsersDataProvider).scoped(),
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
