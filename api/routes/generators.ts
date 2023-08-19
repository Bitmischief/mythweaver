import express, { Request, Response } from "express";
import { useAuthenticateRequest } from "../lib/authMiddleware";
import { z } from "zod";
import {
  useValidateRequest,
  ValidationTypes,
} from "../lib/validationMiddleware";
import { GeneratorController } from "../controllers/generators";

const router = express.Router();

const getGeneratorsSchema = z.object({
  parentId: z.coerce.number().optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
});

router.get("/", [
  useAuthenticateRequest(),
  useValidateRequest(getGeneratorsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const { offset = 0, limit = 10 } = req.query;

    const response = await controller.getGenerators(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      offset as number,
      limit as number
    );

    return res.status(200).send(response);
  },
]);

const generatorIdSchema = z.object({
  generatorCode: z.string().optional(),
});

router.get("/:generatorCode", [
  useAuthenticateRequest(),
  useValidateRequest(generatorIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const { generatorCode } = req.params;

    const response = await controller.getGenerator(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      generatorCode as string
    );

    return res.status(200).send(response);
  },
]);

router.post("/:generatorCode/generate/quick", [
  useAuthenticateRequest(),
  useValidateRequest(generatorIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const { generatorCode = 0 } = req.params;

    const response = await controller.postGeneratorGenerateQuick(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      generatorCode as string
    );

    return res.status(200).send(response);
  },
]);

const postGeneratorGenerateSchema = z.object({
  campaignId: z.coerce.number(),
  customArgs: z
    .array(
      z.object({
        key: z.string(),
        value: z.any(),
      })
    )
    .optional(),
});

router.post("/:generatorCode/generate", [
  useAuthenticateRequest(),
  useValidateRequest(generatorIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postGeneratorGenerateSchema),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const { generatorCode = 0 } = req.params;

    const response = await controller.postGeneratorGenerate(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      generatorCode as string,
      req.body
    );

    return res.status(200).send(response);
  },
]);

const postGenerateCharacterImageSchema = z.object({
  looks: z.string().min(0).max(2000),
});

router.post("/image", [
  useAuthenticateRequest(),
  useValidateRequest(postGenerateCharacterImageSchema),
  async (req: Request, res: Response) => {
    const controller = new GeneratorController();

    const response = await controller.postGenerateCharacterImage(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body
    );
    return res.status(200).send(response);
  },
]);

export default router;
