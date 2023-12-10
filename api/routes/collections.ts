import express, { Request, Response } from 'express';
import { useAuthenticateRequest } from '../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import CollectionController from '../controllers/collections';
import { useInjectLoggingInfo } from '../lib/loggingMiddleware';
import { ImageStylePreset } from '../controllers/images';

const router = express.Router();

const postCollectionSchema = z.object({
  campaignId: z.number(),
  name: z.string().max(50),
  description: z.string().max(300),
});

router.post('/', [
  useAuthenticateRequest(),
  useValidateRequest(postCollectionSchema),
  async (req: Request, res: Response) => {
    const controller = new CollectionController();

    const response = await controller.postCollection(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );
    return res.status(201).send(response);
  },
]);

const getCollectionsSchema = z.object({
  campaignId: z.coerce.number().default(0),
  saved: z.coerce.boolean().default(false).optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(25).optional(),
  parentId: z.coerce.number().min(0).default(0).optional(),
});

router.get('/', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getCollectionsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new CollectionController();

    const { saved = false, offset = 0, limit = 25 } = req.query;

    const response = await controller.getCollections(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      saved as boolean,
      offset as number,
      limit as number,
      req.query.parentId,
    );

    return res.status(200).send(response);
  },
]);

const getCollectionTagsSchema = z.object({
  term: z.string().optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(25).optional(),
});

router.get('/tags', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getCollectionTagsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new CollectionController();

    const { term, offset = 0, limit = 25 } = req.query;

    const response = await controller.getCollectionTags(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      term as string,
      offset as number,
      limit as number,
    );

    return res.status(200).send(response);
  },
]);

const getCollectionSchema = z.object({
  collectionId: z.coerce.number().default(0),
});

router.get('/:collectionId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getCollectionSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CollectionController();

    const { collectionId = 0 } = req.params;

    const response = await controller.getCollection(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      collectionId as number,
    );
    return res.status(200).send(response);
  },
]);

const postSaveCollectionsSchema = z.object({
  collectionId: z.coerce.number(),
});

router.post('/:collectionId/save', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postSaveCollectionsSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CollectionController();

    const response = await controller.postSaveCollection(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.collectionId as unknown as number,
      0, //todo:make actual parent id
    );
    return res.status(200).send(response);
  },
]);

const patchCollectionsSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  parentId: z.number().optional(),
});

router.patch('/:collectionId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(patchCollectionsSchema),
  useValidateRequest(getCollectionSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CollectionController();

    const { collectionId = 0 } = req.params;

    const response = await controller.patchCollection(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      collectionId as number,
      req.body,
    );
    return res.status(200).send(response);
  },
]);

router.delete('/:collectionId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getCollectionSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CollectionController();

    const { collectionId = 0 } = req.params;

    await controller.deleteCollection(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      collectionId as number,
    );
    return res.status(200).send();
  },
]);

const postRemoveCollectionsSchema = z.object({
  collectionId: z.coerce.number(),
});

router.post('/:collectionId/remove', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postRemoveCollectionsSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CollectionController();

    const response = await controller.postRemoveCollection(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.collectionId as unknown as number,
    );
    return res.status(200).send(response);
  },
]);

const postCopyCollectionsSchema = z.object({
  collectionId: z.coerce.number(),
});

router.post('/:collectionId/copy', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postCopyCollectionsSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CollectionController();

    const response = await controller.postCopyCollection(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.collectionId as unknown as number,
    );
    return res.status(200).send(response);
  },
]);

export default router;
