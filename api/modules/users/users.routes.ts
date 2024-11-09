import express, { Request, Response } from 'express';
import {
  checkAuth0Jwt,
  useAuthenticateServiceRequest,
  useInjectUserId,
} from '../../lib/authMiddleware';
import { z } from 'zod';
import { useValidateRequest } from '../../lib/validationMiddleware';
import { UsersController } from './users.controller';
import { useInjectLoggingInfo } from '../../lib/loggingMiddleware';
import { injectDependencies } from './users.dependencies';

const router = express.Router({ mergeParams: true });

router.get('/me', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<UsersController>('usersController');

    const response = await controller.getUser(
      res.locals.auth.userId,
      res.locals.trackingInfo,
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
  initialTrackingData: z.any().optional(),
  onboarded: z.boolean().optional(),
});

router.patch('/me', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(patchUsersSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<UsersController>('usersController');

    const response = await controller.patchUser(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

router.get('/me/subscription', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<UsersController>('usersController');

    const response = await controller.getSubscription(
      res.locals.auth.userId,
      res.locals.trackingInfo,
    );

    return res.status(200).send(response);
  },
]);

const postAddCreditsSchema = z.object({
  email: z.string(),
  amount: z.number(),
});

router.post('/add-credits', [
  useAuthenticateServiceRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postAddCreditsSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<UsersController>('usersController');

    const response = await controller.addUserCredits(
      res.locals.trackingInfo,
      req.body,
    );
    return res.status(200).send(response);
  },
]);

export default router;
