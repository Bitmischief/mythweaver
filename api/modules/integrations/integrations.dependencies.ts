import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { NextFunction, Request, Response } from 'express';
import { IntegrationsController } from '@/modules/integrations/integrations.controller';
import { IntegrationsService } from '@/modules/integrations/integrations.service';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { UserTokensDataProvider } from '@/modules/userTokens/userTokens.dataprovider';
import { useLogger } from '@/lib/loggingMiddleware';

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
