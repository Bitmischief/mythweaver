import express, { Request, Response } from 'express';
import {
  checkAuth0Jwt,
  useAuthenticateServiceRequest,
  useInjectUserId,
} from '../lib/authMiddleware';
import { z } from 'zod';
import { useValidateRequest, ValidationTypes } from '../lib/validationMiddleware';
import UserController from '../controllers/users';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';
import axios from 'axios';

const router = express.Router();

router.get('/me', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const controller = new UserController();

    const response = await controller.getUser(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
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
  async (req: Request, res: Response) => {
    const controller = new UserController();

    const response = await controller.patchUser(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      req.body,
    );

    return res.status(200).send(response);
  },
]);

router.get('/me/subscription', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const controller = new UserController();

    const response = await controller.getSubscription(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
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
  async (req: Request, res: Response) => {
    const controller = new UserController();

    const response = await controller.addUserCredits(
      res.locals.trackingInfo,
      useLogger(),
      req.body,
    );
    return res.status(200).send(response);
  },
]);

router.get('/connect-discord', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  (req: Request, res: Response) => {
    const logger = useLogger();
    logger.info('Received request to connect discord account');
    const userId = res.locals.auth.userId;
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    res.status(200).json({ redirectUri: `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process.env.DISCORD_REDIRECT_URI}&response_type=code&scope=identify&state=${state}` });
  }
]);

const discordCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

router.get('/connect-discord-callback', [
  useInjectLoggingInfo(),
  useValidateRequest(discordCallbackSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const logger = useLogger();
    const { code, state } = req.query;

    logger.info('Received discord callback', { code, state });

    try {      
      const { userId } = JSON.parse(Buffer.from(state as string, 'base64').toString());

      const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
        new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID!,
          client_secret: process.env.DISCORD_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: process.env.DISCORD_REDIRECT_URI!,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token } = tokenResponse.data;

      const userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const { id: discordId } = userResponse.data;

      const controller = new UserController();
      await controller.updateDiscordConnection(
        userId,
        logger,
        discordId,
      );

      res.send('Successfully connected Discord account!');
    } catch (error) {
      logger.error('Error connecting Discord account', {}, error);
      res.status(500).send('Error connecting Discord account');
    }
  }
]);

export default router;
