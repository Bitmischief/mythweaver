import express, { Request, Response } from 'express';
import { checkAuth0Jwt } from '@/modules/core/middleware/auth0';
import { useInjectUserId } from '@/modules/core/middleware/userMiddleware';
import { useInjectLoggingInfo } from '@/modules/core/logging/loggingMiddleware';
import { ArtistsController } from '@/modules/artists/artists.controller';
import { z } from 'zod';
import { useValidateRequest } from '../core/middleware/validationMiddleware';
import { ValidationTypes } from '../core/middleware/validationMiddleware';

const router = express.Router({ mergeParams: true });

const getArtistSchema = z.object({
  artistId: z.coerce.number().default(0),
});

router.get('/:artistId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getArtistSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ArtistsController>('artistsController');

    const response = await controller.getArtist(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.artistId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

export default router;
