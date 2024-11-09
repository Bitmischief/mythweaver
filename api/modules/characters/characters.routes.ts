import express, { Request, Response } from 'express';
import { z } from 'zod';
import { checkAuth0Jwt, useInjectUserId } from '../../lib/authMiddleware';
import { useInjectLoggingInfo } from '../../lib/loggingMiddleware';
import { CharactersController } from './characters.controller';
import { injectDependencies } from './characters.dependencies';
import { useValidateRequest } from '../../lib/validationMiddleware';

const router = express.Router({ mergeParams: true });

const postCharactersSchema = z.object({
  campaignId: z.number(),
  age: z.coerce.number().min(1).max(9999).optional(),
  race: z.string().max(50).optional(),
  class: z.string().max(50).optional(),
  imageUri: z.string().max(2000).optional(),
  name: z.string().max(50).optional(),
  backstory: z.string().max(10000).optional(),
  personality: z.string().max(2000).optional(),
  looks: z.string().max(2000).optional().nullable(),
});

router.post('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postCharactersSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CharactersController>(
      'charactersController',
    );
    const response = await controller.postCharacter(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );
    return res.status(201).send(response);
  },
]);

const patchCharactersSchema = z.object({
  age: z.coerce.number().min(1).max(9999),
  race: z.string().max(50),
  class: z.string().max(50),
  imageUri: z.string().max(2000).optional(),
  name: z.string().max(50).optional(),
  backstory: z.string().max(10000).optional(),
  personality: z.string().max(2000).optional(),
  looks: z.string().max(2000).optional().nullable(),
});

router.patch('/:characterId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(patchCharactersSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CharactersController>(
      'charactersController',
    );
    const response = await controller.patchCharacter(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.characterId),
      req.body,
    );
    return res.status(200).send(response);
  },
]);

router.delete('/:characterId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<CharactersController>(
      'charactersController',
    );
    await controller.deleteCharacter(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.characterId),
    );
    return res.status(204).send();
  },
]);

export default router;
