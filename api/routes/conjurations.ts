import express, { Request, Response } from 'express';
import { checkAuth0Jwt, useInjectUserId } from '../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import ConjurationController from '../controllers/conjurations';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';
import { ImageStylePreset } from '../controllers/images';
import { ConjurationRelationshipType } from '@prisma/client';
import conjurers from '../data/conjurers';

const router = express.Router();

const getConjurationsSchema = z.object({
  campaignId: z.coerce.number().default(0),
  saved: z.coerce.boolean().default(false).optional(),
  conjurerCodes: z.string().optional(),
  stylePreset: z.enum(['fantasy-art', 'digital-art', 'comic-book']).optional(),
  tags: z.string().optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(25).optional(),
  history: z.coerce.boolean().optional(),
  search: z.coerce.string().optional(),
  nodeId: z.coerce.number().optional(),
  nodeType: z
    .enum([
      ConjurationRelationshipType.CAMPAIGN,
      ConjurationRelationshipType.SESSION,
      ConjurationRelationshipType.CHARACTER,
      ConjurationRelationshipType.CONJURATION,
    ])
    .default(ConjurationRelationshipType.CONJURATION)
    .optional(),
  collectionId: z.coerce.number().optional(),
});

const getConjurationRequestSchema = z.object({
  requestId: z.coerce.number().default(0),
});

const zodEnum = <T>(arr: T[]): [T, ...T[]] => arr as [T, ...T[]];
const postConvertConjurationRequestSchema = z.object({
  conjurationId: z.coerce.number().default(0),
  conjurerCode: z.enum(zodEnum(conjurers.map((c: any) => c.code as string))),
});

router.get('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getConjurationsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const {
      campaignId = 0,
      saved = false,
      conjurerCodes,
      stylePreset,
      tags,
      offset = 0,
      limit = 25,
      history = false,
      search = undefined,
      nodeId = undefined,
      nodeType = undefined,
      collectionId = undefined,
    } = req.query;

    const response = await controller.getConjurations(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      campaignId as number,
      saved as boolean,
      conjurerCodes as string,
      stylePreset as ImageStylePreset,
      tags as string,
      offset as number,
      limit as number,
      history as boolean,
      search as string,
      nodeId as unknown as number,
      nodeType as ConjurationRelationshipType,
      collectionId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

const getConjurationTagsSchema = z.object({
  term: z.string().optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(25).optional(),
});

router.get('/tags', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getConjurationTagsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const { term, offset = 0, limit = 25 } = req.query;

    const response = await controller.getConjurationTags(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      term as string,
      offset as number,
      limit as number,
    );

    return res.status(200).send(response);
  },
]);

const getConjurationSchema = z.object({
  conjurationId: z.coerce.number().default(0),
});

router.get('/:conjurationId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getConjurationSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const { conjurationId = 0 } = req.params;

    const response = await controller.getConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      conjurationId as number,
    );
    return res.status(200).send(response);
  },
]);

const postSaveConjurationsSchema = z.object({
  conjurationId: z.coerce.number(),
});

router.post('/:conjurationId/save', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postSaveConjurationsSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const response = await controller.postSaveConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      req.params.conjurationId as unknown as number,
    );
    return res.status(200).send(response);
  },
]);

const patchConjurationsSchema = z.object({
  name: z.string().optional(),
  imageUri: z.string().optional(),
  imageAIPrompt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  data: z.any().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});

router.patch('/:conjurationId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(patchConjurationsSchema),
  useValidateRequest(getConjurationSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const { conjurationId = 0 } = req.params;

    const response = await controller.patchConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      conjurationId as number,
      req.body,
    );
    return res.status(200).send(response);
  },
]);

router.delete('/:conjurationId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getConjurationSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const { conjurationId = 0 } = req.params;

    await controller.deleteConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      conjurationId as number,
    );
    return res.status(200).send();
  },
]);

const postRemoveConjurationsSchema = z.object({
  conjurationId: z.coerce.number(),
});

router.post('/:conjurationId/remove', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postRemoveConjurationsSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const response = await controller.postRemoveConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      req.params.conjurationId as unknown as number,
    );
    return res.status(200).send(response);
  },
]);

const postCopyConjurationsSchema = z.object({
  conjurationId: z.coerce.number(),
});

router.post('/:conjurationId/copy', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postCopyConjurationsSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const response = await controller.postCopyConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      req.params.conjurationId as unknown as number,
    );
    return res.status(200).send(response);
  },
]);

router.get('/request/:requestId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getConjurationRequestSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const { requestId = 0 } = req.params;

    const response = await controller.getConjurationRequest(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      requestId as number,
    );
    return res.status(200).send(response);
  },
]);

router.post('/convert', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postConvertConjurationRequestSchema),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const response = await controller.convertConjurationTypes(
      res.locals.auth.userId,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

export default router;
