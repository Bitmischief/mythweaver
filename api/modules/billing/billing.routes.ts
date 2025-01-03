import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { z } from 'zod';
import { checkAuth0Jwt, useInjectUserId } from '@/lib/authMiddleware';
import { useInjectLoggingInfo } from '@/lib/loggingMiddleware';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/lib/validationMiddleware';
import BillingController from '@/modules/billing/billing.controller';
import { injectDependencies } from '@/modules/billing/billing.dependencies';
import { StripeProvider } from '@/providers/stripe';

const router = express.Router({ mergeParams: true });

const postCheckoutUrlSchema = z.object({
  priceId: z.string(),
  subscription: z.boolean(),
});

router.post('/checkout-url', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postCheckoutUrlSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<BillingController>('billingController');
    const response = await controller.getCheckoutUrl(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );
    return res.status(200).send(response);
  },
]);

router.get('/redeem-preorder-url', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<BillingController>('billingController');
    const response = await controller.getRedeemPreOrderUrl(
      res.locals.auth.userId,
      res.locals.trackingInfo,
    );
    return res.status(200).send(response);
  },
]);

const getPortalUrlSchema = z.object({
  upgrade: z.coerce.boolean().optional(),
  newPlanPriceId: z.string().optional(),
  redirectUri: z.string().url().optional(),
});

router.get('/portal-url', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getPortalUrlSchema, {
    validationType: ValidationTypes.Query,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<BillingController>('billingController');
    const response = await controller.getPortalUrl(
      res.locals.auth.userId,
      req.query.upgrade as unknown as boolean,
      req.query.newPlanPriceId as unknown as string,
      req.query.redirectUri as unknown as string,
    );
    return res.status(200).send(response);
  },
]);

router.post('/webhook', [
  useInjectLoggingInfo(),
  bodyParser.raw({ type: 'application/json' }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<BillingController>('billingController');
    const stripeProvider =
      req.container.resolve<StripeProvider>('stripeProvider');

    const sig = req.headers['stripe-signature'];
    const event = await stripeProvider.validateEvent(
      (req as any).rawBody,
      sig as string,
    );

    await controller.processWebhook(event);
    res.status(200).send();
  },
]);

export default router;
