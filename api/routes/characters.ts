import { z } from 'zod';
import express, { Request, Response } from 'express';
import { useAuthenticateRequest } from '../lib/authMiddleware';
import { useValidateRequest } from '../lib/validationMiddleware';
import CharacterController from '../controllers/characters';

const router = express.Router();

const postCharactersSchema = z.object({
  campaignId: z.number(),
  name: z.string().max(50),
  background: z.string().max(500),
  personality: z.string().max(500),
  looks: z.string().max(500),
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

export default router;
