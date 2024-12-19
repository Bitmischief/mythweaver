import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import BillingController from '@/modules/billing/billing.controller';
import { BillingService } from '@/modules/billing/billing.service';
import { BillingDataProvider } from '@/modules/billing/billing.dataprovider';
import { StripeProvider } from '@/providers/stripe';
import { useLogger } from '@/modules/core/logging/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { EmailProvider } from '@/providers/emailProvider';
import { DiscordProvider } from '@/providers/discordProvider';
import { CreditsProvider } from '@/providers/creditsProvider';

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
