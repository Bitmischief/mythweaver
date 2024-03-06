import express, { Request, Response } from 'express';
import { useAuthenticateRequest } from '../lib/authMiddleware';
import { z } from 'zod';
import { useValidateRequest } from '../lib/validationMiddleware';
import ImageController from '../controllers/images';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';

const router = express.Router();

const postImageSchema = z.object({
  prompt: z.string().max(1000),
  negativePrompt: z.string().max(1000).optional(),
  stylePreset: z.string().max(250).optional(),
  count: z.number().default(1).optional(),
});

router.post('/', [
  useAuthenticateRequest(),
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

export default router;
