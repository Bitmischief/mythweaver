import express, { Request, Response } from 'express';
import { useAuthenticateRequest } from '../lib/authMiddleware';
import { z } from 'zod';
import { useValidateRequest } from '../lib/validationMiddleware';
import ImageController from '../controllers/images';

const router = express.Router();

const postImageSchema = z.object({
  prompt: z.string().max(250),
});

router.post('/', [
  useAuthenticateRequest(),
  useValidateRequest(postImageSchema),
  async (req: Request, res: Response) => {
    const controller = new ImageController();

    const response = await controller.postImage(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body
    );

    return res.status(200).send(response);
  },
]);

export default router;
