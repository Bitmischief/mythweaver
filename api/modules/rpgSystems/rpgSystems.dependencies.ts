import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { RpgSystemsController } from '@/modules/rpgSystems/rpgSystems.controller';
import { RpgSystemsService } from '@/modules/rpgSystems/rpgSystems.service';
import { RpgSystemsDataProvider } from '@/modules/rpgSystems/rpgSystems.dataprovider';
import { useLogger } from '@/modules/core/logging/loggingMiddleware';
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
