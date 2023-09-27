import express, { Request, Response } from 'express';
import { useAuthenticateRequest } from '../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import SessionController from '../controllers/sessions';
import { useInjectLoggingInfo } from '../lib/loggingMiddleware';

const router = express.Router();

const getSessionsSchema = z.object({
  campaignId: z.coerce.number().default(0),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
});

router.get('/', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const { campaignId = 0, offset = 0, limit = 10 } = req.query;

    const response = await controller.getSessions(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      campaignId as number,
      offset as number,
      limit as number,
    );

    return res.status(200).send(response);
  },
]);

const getSessionSchema = z.object({
  sessionId: z.coerce.number().default(0),
});

router.get('/:sessionId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const { sessionId = 0 } = req.params;

    const response = await controller.getSession(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      sessionId as number,
    );

    return res.status(200).send(response);
  },
]);

const postSessionsSchema = z.object({
  campaignId: z.coerce.number(),
  when: z.string().datetime(),
  summary: z.string().optional(),
  transcript: z.string().optional(),
  description: z.string().optional(),
});

router.post('/', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postSessionsSchema),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const response = await controller.postSession(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );

    return res.status(201).send(response);
  },
]);

const patchSessionsSchema = z.object({
  when: z.string().datetime(),
  summary: z.string().nullable().optional(),
  transcript: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

router.patch('/:sessionId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(patchSessionsSchema),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const { sessionId = 0 } = req.params;

    const response = await controller.patchSession(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      sessionId as number,
      req.body,
    );

    return res.status(200).send(response);
  },
]);

router.delete('/:sessionId', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const { sessionId = 0 } = req.params;

    await controller.deleteSession(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      sessionId as number,
    );

    return res.status(200).send();
  },
]);

const postSessionCompleteSchema = z.object({
  recap: z.string().max(10000),
});

router.post('/:sessionId/complete', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postSessionCompleteSchema),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const { sessionId = 0 } = req.params;

    await controller.postCompleteSession(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      sessionId as number,
      req.body,
    );

    return res.status(200).send();
  },
]);

export default router;
