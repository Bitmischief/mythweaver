import express, { Request, Response } from 'express';
import { checkAuth0Jwt } from '@/modules/core/middleware/auth0';
import { useInjectUserId } from '@/modules/core/middleware/userMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/modules/core/middleware/validationMiddleware';
import { CampaignFilesController } from '@/modules/campaigns/files/campaignFiles.controller';
import { useInjectLoggingInfo } from '@/modules/core/logging/loggingMiddleware';
import {
  useCampaignFileUploadAuthorizer,
  useCampaignFileUploader,
} from '@/modules/campaigns/campaign.middleware';

const router = express.Router({ mergeParams: true });

const getCampaignFilesSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

router.post('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getCampaignFilesSchema, {
    validationType: ValidationTypes.Route,
  }),
  useCampaignFileUploadAuthorizer(),
  useCampaignFileUploader(),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CampaignFilesController>(
      'campaignFilesController',
    );

    const file = req.file as any;
    const campaignId = req.params.campaignId as unknown as number;

    await controller.postCampaignFiles(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      campaignId,
      {
        name: file?.originalname ?? '',
        uri: file?.location ?? '',
        force: req.body.force ?? false,
      },
    );

    return res.status(200).send();
  },
]);

router.get('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getCampaignFilesSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CampaignFilesController>(
      'campaignFilesController',
    );

    const campaignId = req.params.campaignId as unknown as number;

    const files = await controller.getCampaignFiles(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      campaignId,
    );

    return res.status(200).send(files);
  },
]);

const deleteCampaignFileSchema = z.object({
  campaignId: z.coerce.number().default(0),
  fileId: z.coerce.number().default(0),
});

router.delete('/:fileId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(deleteCampaignFileSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CampaignFilesController>(
      'campaignFilesController',
    );

    await controller.deleteCampaignFile(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.campaignId as unknown as number,
      req.params.fileId as unknown as number,
    );

    return res.status(200).send();
  },
]);

export default router;
