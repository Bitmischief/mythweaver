import express, { Request, Response } from 'express';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/lib/validationMiddleware';
import { ConjurationsController } from '@/modules/conjurations/conjurations.controller';
import { checkAuth0Jwt, useInjectUserId } from '@/lib/authMiddleware';
import { useInjectLoggingInfo } from '@/lib/loggingMiddleware';
import { ConjurationRelationshipType } from '@prisma/client';
import { ImageStylePreset } from '@/modules/images/images.interface';
import { injectDependencies } from '@/modules/conjurations/conjurations.dependencies';
import conjurers from '@/data/conjurers';

const router = express.Router({ mergeParams: true });

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
    .enum([ConjurationRelationshipType.CONJURATION])
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

const getConjurationTagsSchema = z.object({
  term: z.string().optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(25).optional(),
});

router.get('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getConjurationsSchema, {
    validationType: ValidationTypes.Query,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<ConjurationsController>(
      'conjurationsController',
    );

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

router.get('/tags', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getConjurationTagsSchema, {
    validationType: ValidationTypes.Query,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<ConjurationsController>(
      'conjurationsController',
    );

    const { term, offset = 0, limit = 25 } = req.query;

    const response = await controller.getConjurationTags(
      res.locals.auth.userId,
      res.locals.trackingInfo,
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
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<ConjurationsController>(
      'conjurationsController',
    );

    const { conjurationId = 0 } = req.params;

    const response = await controller.getConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
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
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<ConjurationsController>(
      'conjurationsController',
    );

    const response = await controller.postSaveConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.conjurationId as unknown as number,
    );
    return res.status(200).send(response);
  },
]);

const patchConjurationsSchema = z.object({
  name: z.string().optional(),
  imageUri: z.string().optional(),
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
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<ConjurationsController>(
      'conjurationsController',
    );

    const { conjurationId = 0 } = req.params;

    const response = await controller.patchConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
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
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<ConjurationsController>(
      'conjurationsController',
    );

    const { conjurationId = 0 } = req.params;

    await controller.deleteConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
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
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<ConjurationsController>(
      'conjurationsController',
    );

    const response = await controller.postRemoveConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
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
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<ConjurationsController>(
      'conjurationsController',
    );

    const response = await controller.postCopyConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
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
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<ConjurationsController>(
      'conjurationsController',
    );

    const { requestId = 0 } = req.params;

    const response = await controller.getConjurationRequest(
      res.locals.auth.userId,
      res.locals.trackingInfo,
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
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<ConjurationsController>(
      'conjurationsController',
    );

    const response = await controller.convertConjurationTypes(
      res.locals.auth.userId,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

export default router;
