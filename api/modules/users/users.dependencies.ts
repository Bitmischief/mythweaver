import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersDataProvider } from './users.dataprovider';
import { ConjurationsDataProvider } from '../conjurations/conjurations.dataprovider';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { CreditsProvider } from '../../providers/creditsProvider';
import { WebSocketProvider } from '../../providers/websocketProvider';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  usersController: asClass(UsersController).scoped(),
  usersService: asClass(UsersService).scoped(),
  usersDataProvider: asClass(UsersDataProvider).scoped(),
  conjurationsDataProvider: asClass(ConjurationsDataProvider).scoped(),
  creditsProvider: asClass(CreditsProvider).singleton(),
  webSocketProvider: asClass(WebSocketProvider).singleton(),
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
