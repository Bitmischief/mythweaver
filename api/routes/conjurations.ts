import express, { Request, Response } from "express";
import { useAuthenticateRequest } from "../lib/authMiddleware";
import { z } from "zod";
import {
  useValidateRequest,
  ValidationTypes,
} from "../lib/validationMiddleware";
import ConjurationController from "../controllers/conjurations";

const router = express.Router();

const getConjurationsSchema = z.object({
  campaignId: z.coerce.number().default(0),
  mine: z.coerce.boolean().default(false).optional(),
  conjurerCodes: z.string().optional(),
  tags: z.string().optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(25).optional(),
});

router.get("/", [
  useAuthenticateRequest(),
  useValidateRequest(getConjurationsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const {
      campaignId = 0,
      mine = false,
      conjurerCodes,
      tags,
      offset = 0,
      limit = 25,
    } = req.query;

    const response = await controller.getConjurations(
      res.locals.auth.userId,
      campaignId as number,
      mine as boolean,
      conjurerCodes as string,
      tags as string,
      offset as number,
      limit as number
    );

    return res.status(200).send(response);
  },
]);

const getConjurationTagsSchema = z.object({
  term: z.string().optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(25).optional(),
});

router.get("/tags", [
  useAuthenticateRequest(),
  useValidateRequest(getConjurationTagsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const { term, offset = 0, limit = 25 } = req.query;

    const response = await controller.getConjurationTags(
      res.locals.auth.userId,
      term as string,
      offset as number,
      limit as number
    );

    return res.status(200).send(response);
  },
]);

const getConjurationSchema = z.object({
  conjurationId: z.coerce.number().default(0),
});

router.get("/:conjurationId", [
  useAuthenticateRequest(),
  useValidateRequest(getConjurationSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const { conjurationId = 0 } = req.params;

    const response = await controller.getConjuration(
      res.locals.auth.userId,
      conjurationId as number
    );
    return res.status(200).send(response);
  },
]);

const postConjurationsSchema = z.object({
  campaignId: z.number(),
  conjurationId: z.number(),
});

router.post("/", [
  useAuthenticateRequest(),
  useValidateRequest(postConjurationsSchema),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const response = await controller.postConjurations(
      res.locals.auth.userId,
      req.body
    );
    return res.status(201).send(response);
  },
]);

const patchConjurationsSchema = z.object({
  name: z.string().optional(),
  imageUri: z.string().optional(),
  tags: z.array(z.string()).optional(),
  data: z.any().optional(),
});

router.patch("/:conjurationId", [
  useAuthenticateRequest(),
  useValidateRequest(patchConjurationsSchema),
  useValidateRequest(getConjurationSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const { conjurationId = 0 } = req.params;

    const response = await controller.patchConjuration(
      res.locals.auth.userId,
      conjurationId as number,
      req.body
    );
    return res.status(200).send(response);
  },
]);

router.delete("/:conjurationId", [
  useAuthenticateRequest(),
  useValidateRequest(getConjurationSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new ConjurationController();

    const { conjurationId = 0 } = req.params;

    await controller.deleteConjuration(
      res.locals.auth.userId,
      conjurationId as number
    );
    return res.status(200).send();
  },
]);

export default router;
