import { z } from 'zod';
import { useInjectUserId } from '@/modules/core/middleware/userMiddleware';
import { checkAuth0Jwt } from '@/modules/core/middleware/auth0';
import { useInjectLoggingInfo } from '@/modules/core/logging/loggingMiddleware';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/modules/core/middleware/validationMiddleware';
import express, { Request, Response } from 'express';
import { CollectionsController } from '@/modules/collections/collections.controller';

const router = express.Router({ mergeParams: true });

const getCollectionsSchema = z.object({
  parentId: z.coerce.number().optional(),
  campaignId: z.coerce.number().optional(),
  conjurationId: z.coerce.number().optional(),
});

router.get('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getCollectionsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CollectionsController>(
      'collectionsController',
    );

    const response = await controller.getCollections(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.query.parentId as unknown as number,
      req.query.campaignId as unknown as number,
      req.query.conjurationId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

const postCollectionsSchema = z.object({
  name: z.string(),
  parentId: z.coerce.number(),
});

router.post('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postCollectionsSchema),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CollectionsController>(
      'collectionsController',
    );

    const response = await controller.postCollection(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const postCollectionConjurationRouteSchema = z.object({
  collectionId: z.coerce.number(),
});

const postCollectionConjurationSchema = z.object({
  conjurationId: z.coerce.number(),
});

router.post('/:collectionId/conjurations', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postCollectionConjurationRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postCollectionConjurationSchema),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CollectionsController>(
      'collectionsController',
    );

    const { collectionId = 0 } = req.params;

    const response = await controller.postCollectionConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      collectionId as unknown as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const deleteCollectionsRouteSchema = z.object({
  collectionId: z.coerce.number(),
});

router.delete('/:collectionId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(deleteCollectionsRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CollectionsController>(
      'collectionsController',
    );

    const { collectionId = 0 } = req.params;

    await controller.deleteCollection(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      collectionId as unknown as number,
    );

    return res.status(200).send();
  },
]);

const patchCollectionsRouteSchema = z.object({
  collectionId: z.coerce.number(),
});

const patchCollectionsSchema = z.object({
  name: z.string(),
});

router.patch('/:collectionId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(patchCollectionsRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(patchCollectionsSchema),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CollectionsController>(
      'collectionsController',
    );

    const { collectionId = 0 } = req.params;

    const response = await controller.patchCollection(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      collectionId as unknown as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const postMoveCollectionConjurationRouteSchema = z.object({
  collectionId: z.coerce.number(),
  conjurationId: z.coerce.number(),
});

const postMoveCollectionConjurationSchema = z.object({
  collectionId: z.coerce.number(),
});

router.post('/:collectionId/conjurations/:conjurationId/move', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postMoveCollectionConjurationRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postMoveCollectionConjurationSchema),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CollectionsController>(
      'collectionsController',
    );

    const { collectionId = 0, conjurationId = 0 } = req.params;

    const response = await controller.postMoveCollectionConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      collectionId as unknown as number,
      conjurationId as unknown as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const postMoveCollectionRouteSchema = z.object({
  collectionId: z.coerce.number(),
});

const postMoveCollectionSchema = z.object({
  parentCollectionId: z.coerce.number(),
});

router.post('/:collectionId/move', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postMoveCollectionRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postMoveCollectionSchema),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CollectionsController>(
      'collectionsController',
    );

    const { collectionId = 0 } = req.params;

    const response = await controller.postMoveCollection(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      collectionId as unknown as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const deleteCollectionsConjurationsRouteSchema = z.object({
  collectionId: z.coerce.number(),
  conjurationId: z.coerce.number(),
});

router.delete('/:collectionId/conjurations/:conjurationId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(deleteCollectionsConjurationsRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CollectionsController>(
      'collectionsController',
    );

    const { collectionId = 0, conjurationId = 0 } = req.params;

    await controller.deleteCollectionConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      collectionId as unknown as number,
      conjurationId as unknown as number,
    );

    return res.status(200).send();
  },
]);

export default router;
