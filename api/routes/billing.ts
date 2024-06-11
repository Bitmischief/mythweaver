import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { checkAuth0Jwt, useInjectUserId } from '../lib/authMiddleware';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';
import BillingController from '../controllers/billing';
import { validateEvent } from '../services/billing';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';

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
  async (req: Request, res: Response) => {
    const controller = new BillingController();

    const response = await controller.getCheckoutUrl(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      req.body,
    );
    return res.status(200).send(response);
  },
]);

router.get('/redeem-preorder-url', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const controller = new BillingController();

    const response = await controller.getRedeemPreOrderUrl(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
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
  async (req: Request, res: Response) => {
    const controller = new BillingController();

    const response = await controller.getPortalUrl(
      res.locals.auth.userId,
      useLogger(),
      req.query,
    );
    return res.status(200).send(response);
  },
]);

router.post('/webhook', [
  useInjectLoggingInfo(),
  bodyParser.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    const event = await validateEvent((req as any).rawBody, sig as string);

    const controller = new BillingController();
    await controller.processWebhook(event, useLogger());
    res.status(200).send();
  },
]);

export default router;
