import express, { Request, Response } from 'express';
import { useAuthenticateServiceRequest } from '@/modules/core/middleware/authMiddleware';
import { checkAuth0Jwt } from '@/modules/core/middleware/auth0';
import { useInjectUserId } from '@/modules/core/middleware/userMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/modules/core/middleware/validationMiddleware';
import { IntegrationsController } from '@/modules/integrations/integrations.controller';
import {
  useInjectLoggingInfo,
  useLogger,
} from '@/modules/core/logging/loggingMiddleware';

const router = express.Router({ mergeParams: true });

router.get('/discord/connect', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<IntegrationsController>(
      'integrationsController',
    );
    const response = await controller.getDiscordConnectUrl(
      res.locals.auth.userId,
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
    const controller = req.container.resolve<IntegrationsController>(
      'integrationsController',
    );
    try {
      const redirectUrl = await controller.handleDiscordCallback(
        req.query.code as string,
        req.query.state as string,
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
    const controller = req.container.resolve<IntegrationsController>(
      'integrationsController',
    );
    try {
      await controller.disconnectDiscord(res.locals.auth.userId);
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
    const controller = req.container.resolve<IntegrationsController>(
      'integrationsController',
    );
    try {
      const response = await controller.getUserTokenForDiscordHandle(
        req.params.discordHandle,
      );

      if (response) {
        res.status(200).json(response);
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
