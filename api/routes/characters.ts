import { z } from 'zod';
import express, { Request, Response } from 'express';
import { checkAuth0Jwt, useInjectUserId } from '../lib/authMiddleware';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import CharacterController from '../controllers/characters';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';

const router = express.Router();

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
  async (req: Request, res: Response) => {
    const controller = new CharacterController();

    const response = await controller.postCharacter(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      req.body,
    );
    return res.status(201).send(response);
  },
]);

const patchCharacterIdSchema = z.object({
  characterId: z.coerce.number(),
});

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
  useValidateRequest(patchCharacterIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CharacterController();

    const response = await controller.patchCharacter(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      req.params.characterId as unknown as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

const deleteCharacterByIdSchema = z.object({
  characterId: z.coerce.number(),
});

router.delete('/:characterId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(deleteCharacterByIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CharacterController();

    const response = await controller.deleteCharacter(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      req.params.characterId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

export default router;
