import express, { Request, Response } from 'express';
import { checkAuth0Jwt, useInjectUserId } from '../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';
import { ImageModelController } from '../controllers/imageModels';

const router = express.Router();

const getImageModelsSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(25).optional(),
});

router.get('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getImageModelsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new ImageModelController();

    const response = await controller.getImageModels(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.query.offset as unknown as number,
      req.query.limit as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

export default router;
