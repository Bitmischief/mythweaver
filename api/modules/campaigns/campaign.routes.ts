import express, { Request, Response } from 'express';
import { useInjectUserId } from '@/modules/core/middleware/userMiddleware';
import { checkAuth0Jwt } from '@/modules/core/middleware/auth0';
import { useAuthenticateRequest } from '@/modules/core/middleware/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/modules/core/middleware/validationMiddleware';
import { CampaignController } from '@/modules/campaigns/campaign.controller';
import rateLimit from 'express-rate-limit';
import { useInjectLoggingInfo } from '@/modules/core/logging/loggingMiddleware';

const router = express.Router({ mergeParams: true });

const getCampaignsSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
  term: z.string().optional(),
});

router.get('/', [
  useAuthenticateRequest(),
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getCampaignsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<CampaignController>('campaignController');

    const { offset = 0, limit = 10, term = undefined } = req.query;

    const response = await controller.getCampaigns(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      offset as number,
      limit as number,
      term as string | undefined,
    );

    return res.status(200).send(response);
  },
]);

const getCampaignSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

router.get('/:campaignId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getCampaignSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<CampaignController>('campaignController');

    const { campaignId = 0 } = req.params;

    const response = await controller.getCampaign(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      campaignId as number,
    );
    return res.status(200).send(response);
  },
]);

const postCampaignSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rpgSystemCode: z.string(),
});

router.post('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postCampaignSchema),
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<CampaignController>('campaignController');

    const response = await controller.createCampaign(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );
    return res.status(201).send(response);
  },
]);

const patchCampaignIdSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

const patchCampaignSchema = z.object({
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  rpgSystemCode: z.string().nullable().optional(),
  publicAdventureCode: z.string().nullable().optional(),
});

router.patch('/:campaignId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(patchCampaignIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(patchCampaignSchema),
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<CampaignController>('campaignController');

    const { campaignId = 0 } = req.params;

    const response = await controller.patchCampaign(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      campaignId as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const deleteCampaignSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

router.delete('/:campaignId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(deleteCampaignSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<CampaignController>('campaignController');

    const { campaignId = 0 } = req.params;

    const response = await controller.deleteCampaign(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      campaignId as number,
    );

    return res.status(200).send(response);
  },
]);

const postInviteCampaignMemberRouteSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

const postInviteCampaignMemberSchema = z.object({
  email: z.string(),
});

router.post('/:campaignId/invite', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postInviteCampaignMemberRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postInviteCampaignMemberSchema, {
    validationType: ValidationTypes.Body,
  }),
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<CampaignController>('campaignController');

    const response = await controller.inviteCampaignMember(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.campaignId as unknown as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const getInviteRouteSchema = z.object({
  inviteCode: z.string(),
});

router.get('/invites/:inviteCode', [
  useValidateRequest(getInviteRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit each IP to 120 requests per windowMs
    handler: function (req, res /*next*/) {
      return res.status(429).json({
        error: 'You sent too many requests. Please wait a while then try again',
      });
    },
  }),
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<CampaignController>('campaignController');

    const response = await controller.getInvite(
      res.locals.trackingInfo,
      req.params.inviteCode as unknown as string,
    );

    return res.status(200).send(response);
  },
]);

const postAcceptInviteRouteSchema = z.object({
  inviteCode: z.string(),
});

router.post('/invites/:inviteCode', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postAcceptInviteRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<CampaignController>('campaignController');

    const response = await controller.acceptInvite(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.inviteCode as unknown as string,
    );

    return res.status(200).send(response);
  },
]);

const getCampaignCharactersRouteSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

router.get('/:campaignId/characters', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getCampaignCharactersRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<CampaignController>('campaignController');

    const response = await controller.getMyCampaignCharacters(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.campaignId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

export default router;
