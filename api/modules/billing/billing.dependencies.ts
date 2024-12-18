import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import BillingController from './billing.controller';
import { BillingService } from './billing.service';
import { BillingDataProvider } from './billing.dataprovider';
import { StripeProvider } from '../../providers/stripe';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { EmailProvider } from '@/providers/emailProvider';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  billingController: asClass(BillingController).scoped(),
  billingService: asClass(BillingService).scoped(),
  billingDataProvider: asClass(BillingDataProvider).scoped(),
  stripeProvider: asClass(StripeProvider).singleton(),
  emailProvider: asClass(EmailProvider).singleton(),
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
