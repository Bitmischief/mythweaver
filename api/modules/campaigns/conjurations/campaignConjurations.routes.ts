import express, { Request, Response } from 'express';
import { checkAuth0Jwt, useInjectUserId } from '../../../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../../../lib/validationMiddleware';
import { injectDependencies } from './campaignConjurations.dependencies';
import { CampaignConjurationsController } from './campaignConjurations.controller';
import { useInjectLoggingInfo } from '../../../lib/loggingMiddleware';

const router = express.Router();

const postCampaignConjurationRouteSchema = z.object({
  campaignId: z.coerce.number(),
  conjurationId: z.coerce.number(),
});

router.post('/:conjurationId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postCampaignConjurationRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CampaignConjurationsController>(
      'campaignConjurationsController',
    );

    const { campaignId, conjurationId } = req.params;

    const response = await controller.postCampaignConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      campaignId as unknown as number,
      conjurationId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

const deleteCampaignConjurationRouteSchema = z.object({
  campaignId: z.coerce.number(),
  conjurationId: z.coerce.number(),
});

router.delete('/:conjurationId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(deleteCampaignConjurationRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CampaignConjurationsController>(
      'campaignConjurationsController',
    );

    const { campaignId, conjurationId } = req.params;

    await controller.deleteCampaignConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      campaignId as unknown as number,
      conjurationId as unknown as number,
    );

    return res.status(200).send();
  },
]);

export default router;
