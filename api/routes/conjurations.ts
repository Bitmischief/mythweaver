import express, { Request, Response } from 'express';
import { useAuthenticateRequest } from '../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import ConjurationController from '../controllers/conjurations';
import { useInjectLoggingInfo } from '../lib/loggingMiddleware';
import { ImageStylePreset } from '../controllers/images';

const router = express.Router();

const getConjurationsSchema = z.object({
  campaignId: z.coerce.number().default(0),
  saved: z.coerce.boolean().default(false).optional(),
  conjurerCodes: z.string().optional(),
  stylePreset: z.enum(['fantasy-art', 'digital-art', 'comic-book']).optional(),
  tags: z.string().optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(25).optional(),
});

router.get('/', [
  useAuthenticateRequest(),
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
  useAuthenticateRequest(),
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
  useAuthenticateRequest(),
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
      conjurationId as number,
    );
    return res.status(200).send(response);
  },
]);

const postSaveConjurationsSchema = z.object({
  conjurationId: z.coerce.number(),
});

router.post('/:conjurationId/save', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postSaveConjurationsSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

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
  imageAIPrompt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  data: z.any().optional(),
  published: z.boolean().optional(),
});

router.patch('/:conjurationId', [
  useAuthenticateRequest(),
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
      conjurationId as number,
      req.body,
    );
    return res.status(200).send(response);
  },
]);

router.delete('/:conjurationId', [
  useAuthenticateRequest(),
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
      conjurationId as number,
    );
    return res.status(200).send();
  },
]);

const postRemoveConjurationsSchema = z.object({
  conjurationId: z.coerce.number(),
});

router.post('/:conjurationId/remove', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postRemoveConjurationsSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

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
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postCopyConjurationsSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const response = await controller.postCopyConjuration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.conjurationId as unknown as number,
    );
    return res.status(200).send(response);
  },
]);

export default router;
