import express, { Request, Response } from 'express';
import { checkAuth0Jwt, useInjectUserId } from '../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import ImageController from '../controllers/images';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';

const router = express.Router();

const postImageSchema = z.object({
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
  async (req: Request, res: Response) => {
    const controller = new ImageController();

    const response = await controller.postImage(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.body,
    );

    return res.status(200).send(response);
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
  async (req: Request, res: Response) => {
    const controller = new ImageController();

    const { imageId = 0 } = req.params;

    const response = await controller.patchImageConjurationId(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      imageId as number,
      req.body,
    );

    return res.status(200).send(response);
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
  async (req: Request, res: Response) => {
    const controller = new ImageController();

    const { imageId = 0 } = req.params;

    const response = await controller.postImageUpscale(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      imageId as number,
    );

    return res.status(200).send(response);
  },
]);

router.patch('/:imageId/primary', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(patchRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ImageController();

    const { imageId = 0 } = req.params;

    const response = await controller.patchPrimaryImage(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      imageId as number,
    );

    return res.status(200).send(response);
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
  async (req: Request, res: Response) => {
    const controller = new ImageController();

    const { conjurationId = 0 } = req.params;

    const response = await controller.getConjurationImageHistory(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      conjurationId as number,
    );

    return res.status(200).send(response);
  },
]);

export default router;
