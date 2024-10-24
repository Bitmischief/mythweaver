import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { UsersDataProvider } from '../users/users.dataprovider';
import { UserTokensDataProvider } from '../userTokens/userTokens.dataprovider';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  integrationsController: asClass(IntegrationsController).scoped(),
  integrationsService: asClass(IntegrationsService).scoped(),
  usersDataProvider: asClass(UsersDataProvider).scoped(),
  userTokensDataProvider: asClass(UserTokensDataProvider).scoped(),
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
