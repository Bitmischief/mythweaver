import express, { Request, Response } from 'express';
import { checkAuth0Jwt, useInjectUserId } from '../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import CampaignController from '../controllers/campaigns';
import rateLimit from 'express-rate-limit';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';
import { ConjurationRelationshipType } from '@prisma/client';

const router = express.Router();

const getCampaignsSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
  term: z.string().optional(),
  nodeId: z.coerce.number().optional(),
  nodeType: z
    .enum([
      ConjurationRelationshipType.CAMPAIGN,
      ConjurationRelationshipType.SESSION,
      ConjurationRelationshipType.CHARACTER,
      ConjurationRelationshipType.CONJURATION,
    ])
    .optional(),
});

router.get('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getCampaignsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const {
      offset = 0,
      limit = 10,
      term = undefined,
      nodeId = undefined,
      nodeType = undefined,
    } = req.query;

    const response = await controller.getCampaigns(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      offset as number,
      limit as number,
      term as string | undefined,
      nodeId as number | undefined,
      nodeType as ConjurationRelationshipType | undefined,
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
    const controller = new CampaignController();

    const { campaignId = 0 } = req.params;

    const response = await controller.getCampaign(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
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
    const controller = new CampaignController();

    const response = await controller.createCampaign(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
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
  checkAuth0Jwt,
  useInjectUserId(),
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
      useLogger(res),
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
    const controller = new CampaignController();

    const { campaignId = 0 } = req.params;

    const response = await controller.deleteCampaign(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
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
  checkAuth0Jwt,
  useInjectUserId(),
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
      useLogger(res),
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
    const controller = new CampaignController();

    const response = await controller.inviteCampaignMember(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
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
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(deleteCampaignMemberRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const response = await controller.deleteCampaignMember(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
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
      useLogger(res),
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
  useValidateRequest(postAcceptInviteRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const response = await controller.acceptInvite(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.params.inviteCode as unknown as string,
    );

    return res.status(200).send(response);
  },
]);

const getCampaignCharacterRouteSchema = z.object({
  campaignId: z.coerce.number().default(0),
  characterId: z.coerce.number().default(0),
});

router.get('/:campaignId/character/:characterId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useValidateRequest(getCampaignCharacterRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const response = await controller.getCampaignCharacter(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.params.campaignId as unknown as number,
      req.params.characterId as unknown as number,
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
  useValidateRequest(getCampaignCharactersRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const response = await controller.getMyCampaignCharacters(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.params.campaignId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

export default router;
