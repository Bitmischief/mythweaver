import express, { Request, Response } from 'express';
import { checkAuth0Jwt, useInjectUserId } from '@/lib/authMiddleware';
import { useInjectLoggingInfo } from '@/lib/loggingMiddleware';
import { ArtistsController } from '@/modules/artists/artists.controller';
import { injectDependencies } from '@/modules/artists/artists.dependencies';

const router = express.Router({ mergeParams: true });

router.get('/:artistId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  injectDependencies,
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
