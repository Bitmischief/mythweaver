import express, { Request, Response } from 'express';
import { checkAuth0Jwt, useInjectUserId } from '../lib/authMiddleware';
import { useInjectLoggingInfo, useLogger } from '../lib/loggingMiddleware';
import { ArtistController } from '../controllers/artists';

const router = express.Router();

router.get('/:artistId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const controller = new ArtistController();

    const response = await controller.getArtist(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(),
      req.params.artistId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

export default router;
