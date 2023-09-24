import { z } from 'zod';
import express, { Request, Response } from 'express';
import { useAuthenticateRequest } from '../lib/authMiddleware';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import CharacterController from '../controllers/characters';

const router = express.Router();

const postCharactersSchema = z.object({
  campaignId: z.number(),
  age: z.coerce.number().min(1).max(9999),
  race: z.string().max(50),
  class: z.string().max(50),
  imageUri: z.string().max(2000),
  name: z.string().max(50),
  background: z.string().max(2000),
  personality: z.string().max(2000),
  looks: z.string().max(2000),
});

router.post('/', [
  useAuthenticateRequest(),
  useValidateRequest(postCharactersSchema),
  async (req: Request, res: Response) => {
    const controller = new CharacterController();

    const response = await controller.postCharacter(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body
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
  imageUri: z.string().max(2000),
  name: z.string().max(50),
  background: z.string().max(2000),
  personality: z.string().max(2000),
  looks: z.string().max(2000),
});

router.patch('/:characterId', [
  useAuthenticateRequest(),
  useValidateRequest(patchCharactersSchema),
  useValidateRequest(patchCharacterIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CharacterController();

    const response = await controller.patchCharacter(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.characterId as unknown as number,
      req.body
    );

    return res.status(200).send(response);
  },
]);

export default router;
