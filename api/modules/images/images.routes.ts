import express, { Request, Response } from 'express';
import { z } from 'zod';
import { checkAuth0Jwt, useInjectUserId } from '../../lib/authMiddleware';
import { useInjectLoggingInfo } from '../../lib/loggingMiddleware';
import {
  useValidateRequest,
  ValidationTypes,
} from '../../lib/validationMiddleware';
import { ImagesController } from './images.controller';
import { injectDependencies } from './images.dependencies';

const router = express.Router();

const postImageSchema = z.object({
  modelId: z.number().optional(),
  prompt: z.string().max(1000),
  negativePrompt: z.string().max(1000).optional(),
  stylePreset: z.string().max(250).optional(),
  count: z.number().default(1).optional(),
  seed: z.string().optional(),
  linking: z
    .object({
      sessionId: z.number().optional(),
      conjurationId: z.number().optional(),
      characterId: z.number().optional(),
    })
    .optional(),
});

router.post('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postImageSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.postImage(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );
    return res.status(200).json(response);
  },
]);

const patchRouteSchema = z.object({
  imageId: z.coerce.number(),
});
const patchConjurationIdSchema = z.object({
  conjurationId: z.coerce.number(),
});

router.patch('/:imageId/conjurationId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(patchRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(patchConjurationIdSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.patchImageConjurationId(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
      req.body,
    );
    return res.status(200).json(response);
  },
]);

const postUpscaleRouteSchema = z.object({
  imageId: z.coerce.number(),
});

router.post('/:imageId/upscale', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postUpscaleRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.postImageUpscale(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
    );
    return res.status(200).json(response);
  },
]);

router.patch('/:imageId/primary', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(patchRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.patchPrimaryImage(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
    );
    return res.status(200).json(response);
  },
]);

const getConjurationImageHistorySchema = z.object({
  conjurationId: z.coerce.number(),
});

router.get('/conjurations/:conjurationId/history', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getConjurationImageHistorySchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.getConjurationImageHistory(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.conjurationId),
    );
    return res.status(200).json(response);
  },
]);

const getUserImagesSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(50).optional(),
});

router.get('/gallery', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getUserImagesSchema, {
    validationType: ValidationTypes.Query,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.getUserImages(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.query.offset as unknown as number,
      req.query.limit as unknown as number,
    );
    return res.status(200).json(response);
  },
]);

export default router;
