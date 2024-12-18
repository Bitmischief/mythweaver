import express, { Request, Response } from 'express';
import { checkAuth0Jwt, useInjectUserId } from '@/lib/authMiddleware';
import { useInjectLoggingInfo } from '@/lib/loggingMiddleware';
import { GeneratorsController } from '@/modules/generators/generators.controller';
import { injectDependencies } from '@/modules/generators/generators.dependencies';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/lib/validationMiddleware';
import { z } from 'zod';

const router = express.Router({ mergeParams: true });

const getGeneratorsSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().default(50).optional(),
});

router.get('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getGeneratorsSchema, {
    validationType: ValidationTypes.Query,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<GeneratorsController>(
      'generatorsController',
    );
    const response = await controller.getGenerators(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.query.offset as unknown as number,
      req.query.limit as unknown as number,
    );
    return res.status(200).send(response);
  },
]);

router.get('/:code', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<GeneratorsController>(
      'generatorsController',
    );
    const response = controller.getGenerator(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.code,
    );
    return res.status(200).send(response);
  },
]);

router.post('/:code/generate/quick', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<GeneratorsController>(
      'generatorsController',
    );
    const response = await controller.postGeneratorGenerateQuick(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.code,
    );
    return res.status(200).send(response);
  },
]);

const postGeneratorGenerateSchema = z.object({
  campaignId: z.number(),
  count: z.number(),
  customArg: z.string().optional(),
  prompt: z.string().optional(),
  type: z.string().optional(),
});

router.post('/:code/generate', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postGeneratorGenerateSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<GeneratorsController>(
      'generatorsController',
    );
    const response = await controller.postGeneratorGenerate(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.code,
      req.body,
    );
    return res.status(200).send(response);
  },
]);

router.get('/requests/:conjurationRequestId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<GeneratorsController>(
      'generatorsController',
    );
    const response = await controller.getConjurationRequest(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.conjurationRequestId),
    );
    return res.status(200).send(response);
  },
]);

const postGenerateArbitrarySchema = z.object({
  background: z.any(),
  context: z.string(),
  propertyName: z.string(),
  length: z.number(),
});

router.post('/arbitrary', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postGenerateArbitrarySchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<GeneratorsController>(
      'generatorsController',
    );
    const response = await controller.postGenerateArbitrary(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );
    return res.status(200).send(response);
  },
]);

const postGenerateArbitraryFromPromptSchema = z.object({
  background: z.any(),
  context: z.string(),
  prompt: z.string(),
});

router.post('/arbitrary/prompt', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postGenerateArbitraryFromPromptSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<GeneratorsController>(
      'generatorsController',
    );
    const response = await controller.postGenerateArbitraryFromPrompt(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );
    return res.status(200).send(response);
  },
]);

const postGenerateArbitraryReplacementSchema = z.object({
  replace: z.string(),
  full: z.string(),
  turbo: z.boolean(),
});

router.post('/arbitrary/replace', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postGenerateArbitraryReplacementSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<GeneratorsController>(
      'generatorsController',
    );
    const response = await controller.postGenerateArbitraryReplacement(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );
    return res.status(200).send(response);
  },
]);

export default router;
