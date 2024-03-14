import express, { Request, Response } from 'express';
import { z } from 'zod';
import { useAuthenticateRequest } from '../lib/authMiddleware';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import { ConjurationRelationshipType } from '@prisma/client';
import RelationshipController from '../controllers/relationships';

const router = express.Router();

const relationshipsRouteSchema = z.object({
  type: z.enum([
    ConjurationRelationshipType.CAMPAIGN,
    ConjurationRelationshipType.SESSION,
    ConjurationRelationshipType.CHARACTER,
    ConjurationRelationshipType.CONJURATION,
  ]),
  nodeId: z.coerce.number(),
});

const getRelationshipsSchema = z.object({
  types: z
    .array(
      z.enum([
        ConjurationRelationshipType.CAMPAIGN,
        ConjurationRelationshipType.SESSION,
        ConjurationRelationshipType.CHARACTER,
        ConjurationRelationshipType.CONJURATION,
      ]),
    )
    .optional(),
  depthLimit: z.coerce.number().min(1).max(10).default(5).optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
});

router.get('/:type/:nodeId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(relationshipsRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(getRelationshipsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new RelationshipController();

    const response = await controller.getRelationships(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.params.type as ConjurationRelationshipType,
      req.params.nodeId as unknown as number,
      req.query.types as ConjurationRelationshipType[],
      req.query.depthLimit as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

const postRelationshipsSchema = z.object({
  relatedNodeType: z.enum([
    ConjurationRelationshipType.CAMPAIGN,
    ConjurationRelationshipType.SESSION,
    ConjurationRelationshipType.CHARACTER,
    ConjurationRelationshipType.CONJURATION,
  ]),
  relatedNodeId: z.coerce.number(),
  comment: z.string().optional().nullable(),
  data: z.any().optional().nullable(),
});

router.post('/:type/:nodeId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(relationshipsRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postRelationshipsSchema),
  async (req: Request, res: Response) => {
    const controller = new RelationshipController();

    const response = await controller.postRelationship(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
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
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(relationshipIdRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new RelationshipController();

    const response = await controller.deleteRelationship(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.params.relationshipId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

const patchRelationshipSchema = z.object({
  comment: z.string().optional().nullable(),
  data: z.any().optional().nullable(),
});

router.patch('/:relationshipId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(relationshipIdRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(patchRelationshipSchema),
  async (req: Request, res: Response) => {
    const controller = new RelationshipController();

    const response = await controller.patchRelationship(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.params.relationshipId as unknown as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

export default router;
