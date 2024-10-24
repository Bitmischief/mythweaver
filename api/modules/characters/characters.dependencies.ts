import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { CharactersDataProvider } from './characters.dataprovider';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { MembersDataProvider } from '../campaigns/members/members.dataprovider';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  charactersController: asClass(CharactersController).scoped(),
  charactersService: asClass(CharactersService).scoped(),
  charactersDataProvider: asClass(CharactersDataProvider).scoped(),
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
