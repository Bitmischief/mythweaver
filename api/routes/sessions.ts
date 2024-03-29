import express, { Request, Response } from 'express';
import { SecurityType, useAuthenticateRequest } from '../lib/authMiddleware';
import { z } from 'zod';
import {
  useValidateRequest,
  ValidationTypes,
} from '../lib/validationMiddleware';
import SessionController from '../controllers/sessions';
import {
  getRequestId,
  useInjectLoggingInfo,
  useLogger,
} from '../lib/loggingMiddleware';
import {
  useAudioFileUploader,
  useAudioUploadAuthorizer,
} from '../lib/audioFileMiddleware';
import { ConjurationRelationshipType } from '@prisma/client';

const router = express.Router();

const getSessionsSchema = z.object({
  campaignId: z.coerce.number().default(0),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
  archived: z.coerce.boolean().default(false).optional(),
  search: z.coerce.string().optional(),
  nodeId: z.coerce.number().optional(),
  nodeType: z
    .enum([
      ConjurationRelationshipType.CAMPAIGN,
      ConjurationRelationshipType.SESSION,
      ConjurationRelationshipType.CHARACTER,
      ConjurationRelationshipType.CONJURATION,
    ])
    .default(ConjurationRelationshipType.CONJURATION)
    .optional(),
});

router.get('/', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const {
      campaignId = 0,
      offset = 0,
      limit = 10,
      nodeId = undefined,
      nodeType = undefined,
    } = req.query;

    const response = await controller.getSessions(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      campaignId as number,
      offset as number,
      limit as number,
      req.query.search as string,
      nodeId as unknown as number,
      nodeType as ConjurationRelationshipType,
      req.query.archived as unknown as boolean,
    );

    return res.status(200).send(response);
  },
]);

const getSessionSchema = z.object({
  sessionId: z.coerce.number().default(0),
});

const transcriptionObjectSchema = z.object({
  text: z.string(),
  segments: z.any().array(),
  language: z.string(),
});

const postSessionTranscriptionSchema = z.object({
  status: z.string(),
  transcription: transcriptionObjectSchema.optional(),
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
      useLogger(res),
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
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(postSessionsSchema),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const response = await controller.postSession(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      req.body,
    );

    return res.status(201).send(response);
  },
]);

const patchSessionsSchema = z.object({
  name: z.string().nullable().optional(),
  archived: z.boolean().nullable().optional(),
  planning: z.string().nullable().optional(),
  imageUri: z.string().nullable().optional(),
  recap: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  transcript: z.string().nullable().optional(),
  suggestions: z.string().nullable().optional(),
  suggestedName: z.string().nullable().optional(),
  suggestedSummary: z.string().nullable().optional(),
  suggestedSuggestions: z.string().nullable().optional(),
  suggestedImageUri: z.string().nullable().optional(),
  suggestedImagePrompt: z.string().nullable().optional(),
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
      useLogger(res),
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
      useLogger(res),
      sessionId as number,
    );

    return res.status(200).send();
  },
]);

const postGenerateSummarySchema = z.object({
  recap: z.string().max(15000),
});

router.post('/:sessionId/generate-summary', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postGenerateSummarySchema),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const { sessionId = 0 } = req.params;

    await controller.postGenerateSummary(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      sessionId as number,
      req.body,
    );

    return res.status(200).send();
  },
]);

router.post('/:sessionId/complete', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const { sessionId = 0 } = req.params;

    await controller.postCompleteSession(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      sessionId as number,
    );

    return res.status(200).send();
  },
]);

router.post('/:sessionId/audio', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  useAudioUploadAuthorizer(),
  useAudioFileUploader(),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const file = req.file as any;
    const { sessionId = 0 } = req.params;
    const response = await controller.postSessionAudio(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      sessionId as number,
      {
        audioName: file?.originalname ?? '',
        audioUri: file?.location ?? '',
      },
    );

    return res.status(200).send(response);
  },
]);

router.post('/:sessionId/transcription', [
  useAuthenticateRequest(),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const { sessionId = 0 } = req.params;
    const requestId = getRequestId(req, res);

    await controller.postSessionTranscription(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      useLogger(res),
      requestId as string,
      sessionId as number,
    );

    return res.status(200).send();
  },
]);

router.patch('/:sessionId/transcription', [
  useAuthenticateRequest(SecurityType.ServiceToken),
  useInjectLoggingInfo(),
  useValidateRequest(getSessionSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postSessionTranscriptionSchema, {
    validationType: ValidationTypes.Body,
    logRequest: false,
  }),
  async (req: Request, res: Response) => {
    const controller = new SessionController();

    const { sessionId = 0 } = req.params;

    await controller.patchSessionTranscription(
      res.locals.trackingInfo,
      useLogger(res),
      sessionId as number,
      req.body,
    );

    return res.status(200).send();
  },
]);

export default router;
