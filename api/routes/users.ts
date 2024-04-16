import express, { Request, Response } from 'express';
import { SecurityType, useAuthenticateRequest } from '../lib/authMiddleware';
import { z } from 'zod';
import { useValidateRequest } from '../lib/validationMiddleware';
import UserController from '../controllers/users';
import mailchimpClient from '../lib/mailchimpMarketing';
import { lists, Status } from '@mailchimp/mailchimp_marketing';
import EmailType = lists.EmailType;
import { format } from 'date-fns';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';

const router = express.Router();

router.get('/me', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const controller = new UserController();

    const response = await controller.getUser(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
    );
    return res.status(200).send(response);
  },
]);

const patchUsersSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
  imageUri: z.string().optional(),
  tags: z.array(z.string()).optional(),
  data: z.array(z.object({ key: z.string(), value: z.any() })).optional(),
  confirmEarlyAccessStart: z.boolean().optional(),
});

router.patch('/me', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(patchUsersSchema),
  async (req: Request, res: Response) => {
    const controller = new UserController();

    const response = await controller.patchUser(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.body,
    );
    return res.status(200).send(response);
  },
]);

router.get('/me/subscription', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const controller = new UserController();

    const response = await controller.getSubscription(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
    );

    return res.status(200).send(response);
  },
]);

const postAddCreditsSchema = z.object({
  email: z.string(),
  amount: z.number(),
});

router.post('/add-credits', [
  useAuthenticateRequest(SecurityType.ServiceToken),
  useInjectLoggingInfo(),
  useValidateRequest(postAddCreditsSchema),
  async (req: Request, res: Response) => {
    const controller = new UserController();

    const response = await controller.addUserCredits(
      res.locals.trackingInfo,
      useLogger(res),
      req.body,
    );
    return res.status(200).send(response);
  },
]);

export default router;
