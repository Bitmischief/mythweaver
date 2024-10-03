import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { z } from 'zod';
import { checkAuth0Jwt, useInjectUserId } from '../../lib/authMiddleware';
import { useInjectLoggingInfo } from '../../lib/loggingMiddleware';
import { useValidateRequest, ValidationTypes } from '../../lib/validationMiddleware';
import BillingController from './billing.controller';
import { injectDependencies } from './billing.dependencies';

const router = express.Router();

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
    const controller = req.container.resolve<BillingController>('billingController');
    const response = await controller.getCheckoutUrl(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body
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
    const response = await res.locals.controller.getRedeemPreOrderUrl(
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
    const response = await res.locals.controller.getPortalUrl(
      res.locals.auth.userId,
      req.query,
    );
    return res.status(200).send(response);
  },
]);

router.post('/webhook', [
  useInjectLoggingInfo(),
  bodyParser.raw({ type: 'application/json' }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const event = await res.locals.stripeProvider.validateEvent((req as any).rawBody, sig as string);
    await res.locals.controller.processWebhook(event);
    res.status(200).send();
  },
]);

export default router;
