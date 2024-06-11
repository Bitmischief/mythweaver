import AuthController from '../controllers/auth';
import express, { Request, Response } from 'express';
import { useValidateRequest } from '../lib/validationMiddleware';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { useLogger } from '../lib/loggingMiddleware';

const router = express.Router();

const postTokenSchema = z.object({
  type: z.string(),
  credential: z.string().optional(),
  inviteCode: z.string().optional(),
});

router.post('/token', [
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit each IP to 120 requests per windowMs
    handler: function (req, res /*next*/) {
      return res.status(429).json({
        error: 'You sent too many requests. Please wait a while then try again',
      });
    },
  }),
  useValidateRequest(postTokenSchema),
  async (req: Request, res: Response) => {
    const controller = new AuthController();
    const response = await controller.postToken(
      req.body,
      res.locals.trackingInfo,
      useLogger(),
    );
    return res.send(response);
  },
]);

const postRefreshSchema = z.object({
  refreshToken: z.string(),
});

router.post('/refresh', [
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit each IP to 120 requests per windowMs
    handler: function (req, res /*next*/) {
      return res.status(429).json({
        error: 'You sent too many requests. Please wait a while then try again',
      });
    },
  }),
  useValidateRequest(postRefreshSchema),
  async (req: Request, res: Response) => {
    const controller = new AuthController();
    const response = await controller.postRefresh(
      req.body,
      res.locals.trackingInfo,
      useLogger(),
    );
    return res.send(response);
  },
]);

const postMagicLinkSchema = z.object({
  email: z.string().email(),
  inviteCode: z.string().optional(),
  conjurationPrompt: z.string().optional(),
});

router.post('/magic-link', [
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit each IP to 120 requests per windowMs
    handler: function (req, res /*next*/) {
      return res.status(429).json({
        error: 'You sent too many requests. Please wait a while then try again',
      });
    },
  }),
  useValidateRequest(postMagicLinkSchema),
  async (req: Request, res: Response) => {
    const controller = new AuthController();
    const response = await controller.postMagicLink(
      res.locals.trackingInfo,
      req.body,
      useLogger(),
    );
    return res.send(response);
  },
]);

export default router;
