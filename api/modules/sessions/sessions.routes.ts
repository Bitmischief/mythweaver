import express, { Request, Response } from 'express';
import {
  checkAuth0Jwt,
  useAuthenticateRequest,
  useInjectUserId,
} from '@/lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/lib/validationMiddleware';
import { useInjectLoggingInfo } from '@/lib/loggingMiddleware';
import {
  useAudioFileUploader,
  useAudioUploadAuthorizer,
} from '@/lib/audioFileMiddleware';
import { SessionsController } from '@/modules/sessions/sessions.controller';
import { injectDependencies } from '@/modules/sessions/sessions.dependencies';

const router = express.Router({ mergeParams: true });

const getSessionsSchema = z.object({
  campaignId: z.coerce.number().default(0),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
  archived: z.coerce.boolean().default(false).optional(),
  search: z.coerce.string().optional(),
});

router.get('/', [
  useAuthenticateRequest(),
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionsSchema, {
    validationType: ValidationTypes.Query,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<SessionsController>('sessionsController');

    const { campaignId = 0, offset = 0, limit = 10 } = req.query;

    const response = await controller.getSessions(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      campaignId as number,
      offset as number,
      limit as number,
      req.query.search as string,
      req.query.archived as unknown as boolean,
    );

    return res.status(200).send(response);
  },
]);

const getSessionSchema = z.object({
  sessionId: z.coerce.number().default(0),
});

router.get('/:sessionId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<SessionsController>('sessionsController');

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
  name: z.string().optional().default('New Session'),
});

router.post('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postSessionsSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<SessionsController>('sessionsController');

    const response = await controller.postSession(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
    );

    return res.status(201).send(response);
  },
]);

const patchSessionsSchema = z.object({
  name: z.string().nullable().optional(),
  archived: z.boolean().nullable().optional(),
  planning: z.string().nullable().optional(),
  planningJson: z.any().nullable().optional(),
  imageUri: z.string().nullable().optional(),
  recap: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  transcript: z.string().nullable().optional(),
  suggestions: z.string().nullable().optional(),
  suggestedName: z.string().nullable().optional(),
  suggestedSummary: z.string().nullable().optional(),
  suggestedRecap: z.string().nullable().optional(),
  suggestedSuggestions: z.string().nullable().optional(),
  date: z.coerce.date().nullable().optional(),
  isOver: z.boolean().nullable().optional(),
  completed: z.boolean().nullable().optional(),
});

router.patch('/:sessionId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(patchSessionsSchema),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<SessionsController>('sessionsController');

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
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<SessionsController>('sessionsController');

    const { sessionId = 0 } = req.params;

    await controller.deleteSession(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      sessionId as number,
    );

    return res.status(200).send();
  },
]);

router.post('/:sessionId/email-summary', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<SessionsController>('sessionsController');

    const { sessionId = 0 } = req.params;

    await controller.postSessionSummaryEmail(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      sessionId as number,
    );

    return res.status(200).send();
  },
]);

router.post('/:sessionId/audio', [
  useAuthenticateRequest(),
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  useAudioUploadAuthorizer(),
  useAudioFileUploader(),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<SessionsController>('sessionsController');

    const file = req.file as any;
    const { sessionId = 0 } = req.params;
    const response = await controller.postSessionAudio(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      sessionId as number,
      {
        audioName: file?.originalname ?? '',
        audioUri: file?.location ?? '',
      },
    );

    return res.status(200).send(response);
  },
]);

router.delete('/:sessionId/audio', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<SessionsController>('sessionsController');

    const { sessionId = 0 } = req.params;

    await controller.deleteSessionAudio(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      sessionId as number,
    );

    return res.status(200).send();
  },
]);

router.get('/:sessionId/transcript', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<SessionsController>('sessionsController');

    const response = await controller.getTranscript(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.params.sessionId as unknown as number,
    );

    return res.status(200).send(response);
  },
]);

export default router;
