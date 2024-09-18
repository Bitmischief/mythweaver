import express, { Request, Response } from 'express';
import {
  checkAuth0Jwt,
  useInjectUserId,
  useAuthenticateServiceRequest,
} from '../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import IntegrationsController from '../controllers/integrations';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';

const router = express.Router();

router.get('/discord/connect', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const controller = new IntegrationsController();
    const response = await controller.getDiscordConnectUrl(
      res.locals.auth.userId,
      useLogger(),
    );
    res.status(200).json(response);
  },
]);

const discordCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

router.get('/discord/callback', [
  useInjectLoggingInfo(),
  useValidateRequest(discordCallbackSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new IntegrationsController();
    try {
      const redirectUrl = await controller.handleDiscordCallback(
        req.query.code as string,
        req.query.state as string,
        useLogger(),
      );
      res.redirect(redirectUrl);
    } catch (error) {
      useLogger().error('Error connecting Discord account', {}, error);
      res.status(500).send('Error connecting Discord account');
    }
  },
]);

router.post('/discord/disconnect', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const controller = new IntegrationsController();
    try {
      await controller.disconnectDiscord(res.locals.auth.userId, useLogger());
      res
        .status(200)
        .json({ message: 'Discord account disconnected successfully' });
    } catch (error) {
      useLogger().error('Error disconnecting Discord account', {}, error);
      res.status(500).send('Error disconnecting Discord account');
    }
  },
]);

router.get('/discord/user/:discordHandle', [
  useAuthenticateServiceRequest(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const controller = new IntegrationsController();
    try {
      const token = await controller.getUserTokenForDiscordHandle(
        req.params.discordHandle,
        useLogger(),
      );

      if (token) {
        res.status(200).json({ token });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      useLogger().error(
        'Error getting user token for Discord handle',
        {},
        error,
      );
      res.status(500).send('Error getting user token for Discord handle');
    }
  },
]);

export default router;
