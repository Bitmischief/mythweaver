import express, { Request, Response } from 'express';
import { useAuthenticateRequest } from '../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import CampaignController from '../controllers/campaigns';
import rateLimit from 'express-rate-limit';
import { useInjectLoggingInfo } from '../lib/loggingMiddleware';

const router = express.Router();

const getCampaignsSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
});

router.get('/', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getCampaignsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const { offset = 0, limit = 10 } = req.query;

    const response = await controller.getCampaigns(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      offset as number,
      limit as number,
    );

    return res.status(200).send(response);
  },
]);

const getCampaignSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

router.get('/:campaignId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getCampaignSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

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
  publicAdventureId: z.string().optional(),
});

router.post('/', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postCampaignSchema),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const response = await controller.createCampaign(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );
    return res.status(201).send(response);
  },
]);

const putCampaignIdSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

const putCampaignSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  rpgSystemCode: z.string(),
  publicAdventureCode: z.string().nullable().optional(),
});

router.put('/:campaignId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(putCampaignIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(putCampaignSchema),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const { campaignId = 0 } = req.params;

    const response = await controller.putCampaign(
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
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(deleteCampaignSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const { campaignId = 0 } = req.params;

    const response = await controller.deleteCampaign(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      campaignId as number,
    );

    return res.status(200).send(response);
  },
]);

const getCampaignMembersRouteSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

const getCampaignMembersSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
});

router.get('/:campaignId/members', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getCampaignMembersRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(getCampaignMembersSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const { offset = 0, limit = 10 } = req.query;

    const response = await controller.getCampaignMembers(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.campaignId as unknown as number,
      offset as number,
      limit as number,
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

router.post('/:campaignId/members', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postInviteCampaignMemberRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postInviteCampaignMemberSchema, {
    validationType: ValidationTypes.Body,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const response = await controller.inviteCampaignMember(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.campaignId as unknown as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const deleteCampaignMemberRouteSchema = z.object({
  campaignId: z.coerce.number().default(0),
  memberId: z.coerce.number().default(0),
});

router.delete('/:campaignId/members/:memberId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(deleteCampaignMemberRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const response = await controller.deleteCampaignMember(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.campaignId as unknown as number,
      req.params.memberId as unknown as number,
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
    const controller = new CampaignController();

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
  useAuthenticateRequest(),
  useValidateRequest(postAcceptInviteRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const response = await controller.acceptInvite(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.inviteCode as unknown as string,
    );

    return res.status(200).send(response);
  },
]);

const getCampaignCharacterRouteSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

router.get('/:campaignId/character', [
  useAuthenticateRequest(),
  useValidateRequest(getCampaignCharacterRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const response = await controller.getMyCampaignCharacter(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.campaignId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

export default router;
