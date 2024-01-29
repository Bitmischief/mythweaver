import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { useAuthenticateRequest } from '../lib/authMiddleware';
import { useInjectLoggingInfo } from '../lib/loggingMiddleware';
import BillingController from '../controllers/billing';
import { validateEvent } from '../services/billing';
import { z } from 'zod';
import { useValidateRequest } from '../lib/validationMiddleware';

const router = express.Router();

const postCheckoutUrlSchema = z.object({
  planId: z.string(),
});

router.post('/checkout-url', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postCheckoutUrlSchema),
  async (req: Request, res: Response) => {
    const controller = new BillingController();

    const response = await controller.getCheckoutUrl(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );
    return res.status(200).send(response);
  },
]);

router.get('/portal-url', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const controller = new BillingController();

    const response = await controller.getPortalUrl(
      res.locals.auth.userId,
      res.locals.trackingInfo,
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
    await controller.processWebhook(event);
    res.status(200).send();
  },
]);

export default router;
