import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { CharactersController } from '@/modules/characters/characters.controller';
import { CharactersService } from '@/modules/characters/characters.service';
import { CharactersDataProvider } from '@/modules/characters/characters.dataprovider';
import { useLogger } from '@/modules/core/logging/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';

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
