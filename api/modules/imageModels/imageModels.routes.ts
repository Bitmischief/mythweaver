import express, { Request, Response } from 'express';
import { checkAuth0Jwt } from '@/modules/core/middleware/auth0';
import { useInjectUserId } from '@/modules/core/middleware/userMiddleware';
import { useInjectLoggingInfo } from '@/modules/core/logging/loggingMiddleware';
import { ImageModelsController } from '@/modules/imageModels/imageModels.controller';
import { injectDependencies } from '@/modules/imageModels/imageModels.dependencies';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/modules/core/middleware/validationMiddleware';
import { z } from 'zod';

const router = express.Router({ mergeParams: true });

const getImageModelsSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().default(50).optional(),
});

router.get('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getImageModelsSchema, {
    validationType: ValidationTypes.Query,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<ImageModelsController>(
      'imageModelsController',
    );
    const response = await controller.getImageModels(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.query.offset as unknown as number,
      req.query.limit as unknown as number,
    );
    return res.status(200).send(response);
  },
]);

export default router;
