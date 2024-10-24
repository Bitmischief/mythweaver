import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { RpgSystemsController } from './rpgSystems.controller';
import { RpgSystemsService } from './rpgSystems.service';
import { RpgSystemsDataProvider } from './rpgSystems.dataprovider';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  rpgSystemsController: asClass(RpgSystemsController).scoped(),
  rpgSystemsService: asClass(RpgSystemsService).scoped(),
  rpgSystemsDataProvider: asClass(RpgSystemsDataProvider).scoped(),
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
