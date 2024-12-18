import { injectDependencies } from '@/modules/conjurations/relationships/relationships.dependencies';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { checkAuth0Jwt, useInjectUserId } from '@/lib/authMiddleware';
import { useInjectLoggingInfo } from '@/lib/loggingMiddleware';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/lib/validationMiddleware';
import { ConjurationRelationshipType } from '@prisma/client';
import { ConjurationsRelationshipsController } from '@/modules/conjurations/relationships/relationships.controller';

const router = express.Router({ mergeParams: true });

const relationshipsRouteSchema = z.object({
  type: z.enum([ConjurationRelationshipType.CONJURATION]),
  nodeId: z.coerce.number(),
});

const getRelationshipsSchema = z.object({
  types: z.array(z.enum([ConjurationRelationshipType.CONJURATION])).optional(),
  depthLimit: z.coerce.number().min(1).max(10).default(5).optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
});

router.get('/:type/:nodeId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(relationshipsRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(getRelationshipsSchema, {
    validationType: ValidationTypes.Query,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ConjurationsRelationshipsController>(
        'conjurationsRelationshipsController',
      );

    const response = await controller.getRelationships(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.type as ConjurationRelationshipType,
      req.params.nodeId as unknown as number,
      req.query.types as ConjurationRelationshipType[],
      req.query.depthLimit as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

const postRelationshipsSchema = z.object({
  relatedNodeType: z.enum([ConjurationRelationshipType.CONJURATION]),
  relatedNodeId: z.coerce.number(),
  comment: z.string().optional().nullable(),
  data: z.any().optional().nullable(),
  twoWay: z.boolean().default(false),
});

router.post('/:type/:nodeId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(relationshipsRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postRelationshipsSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ConjurationsRelationshipsController>(
        'conjurationsRelationshipsController',
      );

    const response = await controller.postRelationship(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.type as ConjurationRelationshipType,
      req.params.nodeId as unknown as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const relationshipIdRouteSchema = z.object({
  relationshipId: z.coerce.number(),
});

router.delete('/:relationshipId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(relationshipIdRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ConjurationsRelationshipsController>(
        'conjurationsRelationshipsController',
      );

    const response = await controller.deleteRelationship(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.relationshipId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

const deleteRelationshipsSchema = z.object({
  previousType: z.enum([ConjurationRelationshipType.CONJURATION]),
  nextType: z.enum([ConjurationRelationshipType.CONJURATION]),
  previousNodeId: z.coerce.number(),
  nextNodeId: z.coerce.number(),
});

router.post('/remove', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(deleteRelationshipsSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ConjurationsRelationshipsController>(
        'conjurationsRelationshipsController',
      );

    const response = await controller.deleteRelationshipByNodeIds(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const patchRelationshipSchema = z.object({
  comment: z.string().optional().nullable(),
  data: z.any().optional().nullable(),
});

router.patch('/:relationshipId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(relationshipIdRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(patchRelationshipSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ConjurationsRelationshipsController>(
        'conjurationsRelationshipsController',
      );

    const response = await controller.patchRelationship(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.relationshipId as unknown as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const getRelationshipGraphSchema = z.object({
  campaignId: z.coerce.number().optional(),
});

router.get('/graph', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getRelationshipGraphSchema, {
    validationType: ValidationTypes.Query,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ConjurationsRelationshipsController>(
        'conjurationsRelationshipsController',
      );

    const { campaignId = undefined } = req.query;

    const response = await controller.getRelationshipGraph(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      campaignId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

export default router;
