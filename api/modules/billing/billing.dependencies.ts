import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import BillingController from './billing.controller';
import { BillingService } from './billing.service';
import { BillingDataProvider } from './billing.dataprovider';
import { StripeProvider } from '../../providers/stripe';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { EmailProvider } from '../../providers/emailProvider';
import { DiscordProvider } from '../../providers/discordProvider';
import { CreditsProvider } from '../../providers/creditsProvider';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  billingController: asClass(BillingController).scoped(),
  billingService: asClass(BillingService).scoped(),
  billingDataProvider: asClass(BillingDataProvider).scoped(),
  stripeProvider: asClass(StripeProvider).singleton(),
  emailProvider: asClass(EmailProvider).singleton(),
  discordProvider: asClass(DiscordProvider).singleton(),
  creditsProvider: asClass(CreditsProvider).singleton(),
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
