import express, { Request, Response } from 'express';
import { checkAuth0Jwt } from '@/modules/core/middleware/auth0';
import { useInjectUserId } from '@/modules/core/middleware/userMiddleware';
import { useInjectLoggingInfo } from '@/modules/core/logging/loggingMiddleware';
import { RpgSystemsController } from '@/modules/rpgSystems/rpgSystems.controller';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/modules/core/middleware/validationMiddleware';
import { z } from 'zod';

const router = express.Router({ mergeParams: true });

const getRpgSystemsSchema = z.object({
  term: z.string().optional(),
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

router.get('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getRpgSystemsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = req.container.resolve<RpgSystemsController>(
      'rpgSystemsController',
    );
    const response = await controller.getRpgSystems(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.query.term as string | undefined,
      req.query.offset as number | undefined,
      req.query.limit as number | undefined,
    );
    return res.status(200).send(response);
  },
]);

export default router;
