import express, { Request, Response } from 'express';
import { checkAuth0Jwt, useInjectUserId } from '../../../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../../../lib/validationMiddleware';
import { useInjectLoggingInfo } from '../../../lib/loggingMiddleware';
import { MembersController } from './members.controller';
import { injectDependencies } from './members.dependencies';

const router = express.Router({ mergeParams: true });

const getCampaignMembersRouteSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

const getCampaignMembersSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
});

router.get('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getCampaignMembersRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(getCampaignMembersSchema, {
    validationType: ValidationTypes.Query,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<MembersController>('membersController');

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

const deleteCampaignMemberRouteSchema = z.object({
  campaignId: z.coerce.number().default(0),
  memberId: z.coerce.number().default(0),
});

router.delete('/:memberId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(deleteCampaignMemberRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<MembersController>('membersController');

    const response = await controller.deleteCampaignMember(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.campaignId as unknown as number,
      req.params.memberId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

export default router;
