import express, { Request, Response } from 'express';
import { checkAuth0Jwt, useInjectUserId } from '../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import { GeneratorController } from '../controllers/generators';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';
import { randomUUID } from 'node:crypto';

const router = express.Router();

const getGeneratorsSchema = z.object({
  parentId: z.coerce.number().optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
});

const postGenerateMagicLinkSchema = z.object({
  magicLink: z.string().uuid(),
});

router.get('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getGeneratorsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const { offset = 0, limit = 10 } = req.query;

    const response = await controller.getGenerators(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      offset as number,
      limit as number,
    );

    return res.status(200).send(response);
  },
]);

const generatorIdSchema = z.object({
  generatorCode: z.string().optional(),
});

router.get('/:generatorCode', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(generatorIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const { generatorCode } = req.params;

    const response = await controller.getGenerator(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      generatorCode as string,
    );

    return res.status(200).send(response);
  },
]);

router.post('/:generatorCode/generate/quick', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(generatorIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const { generatorCode = 0 } = req.params;

    const response = await controller.postGeneratorGenerateQuick(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      generatorCode as string,
    );

    return res.status(200).send(response);
  },
]);

const postGeneratorGenerateSchema = z.object({
  campaignId: z.coerce.number(),
  count: z.coerce.number().min(1).max(5).default(1),
  customArg: z.string().max(1000).optional(),
  prompt: z.string().max(1000).optional(),
  imageStylePreset: z.string().max(500).optional(),
  imagePrompt: z.string().max(1000).optional(),
  imageNegativePrompt: z.string().max(1000).optional(),
});

router.post('/:generatorCode/generate', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(generatorIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postGeneratorGenerateSchema),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const { generatorCode = 0 } = req.params;

    const response = await controller.postGeneratorGenerate(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      generatorCode as string,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const conjurationRequestIdSchema = z.object({
  conjurationRequestId: z.coerce.number(),
});

router.get('/requests/:conjurationRequestId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(conjurationRequestIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const { conjurationRequestId = 0 } = req.params;

    const response = await controller.getConjurationRequest(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      conjurationRequestId as number,
    );

    return res.status(200).send(response);
  },
]);

const postGenerateArbitrarySchema = z.object({
  background: z.any().optional(),
  context: z.string(),
  propertyName: z.string().min(3).max(100),
  length: z.number().min(100).max(5000).default(1000),
});

router.post('/arbitrary', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postGenerateArbitrarySchema),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const response = await controller.postGenerateArbitrary(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const postGenerateArbitraryFromPromptSchema = z.object({
  background: z.any().optional(),
  context: z.string(),
  prompt: z.string().min(3).max(1000),
});

router.post('/arbitrary/prompt', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postGenerateArbitraryFromPromptSchema),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const response = await controller.postGenerateArbitraryFromPrompt(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const postGenerateArbitraryReplacementSchema = z.object({
  full: z.string(),
  replace: z.string(),
  turbo: z.boolean().optional().default(false),
});

router.post('/arbitrary/replace', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postGenerateArbitraryReplacementSchema),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const response = await controller.postGenerateArbitraryReplacement(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.body,
    );

    return res.status(200).send(response);
  },
]);

router.post('/magic-link/:magicLink', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postGenerateMagicLinkSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const { magicLink = randomUUID() } = req.params;

    const response = await controller.postMagicLinkGeneration(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      magicLink,
    );

    return res.status(200).send(response);
  },
]);

export default router;
