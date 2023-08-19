import express, { Request, Response } from "express";
import { useAuthenticateRequest } from "../lib/authMiddleware";
import { z } from "zod";
import {
  useValidateRequest,
  ValidationTypes,
} from "../lib/validationMiddleware";
import CampaignController from "../controllers/campaigns";

const router = express.Router();

const getCampaignsSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
});

router.get("/", [
  useAuthenticateRequest(),
  useValidateRequest(getCampaignsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const { offset = 0, limit = 10 } = req.query;

    const response = await controller.getCampaigns(
      res.locals.auth.userId,
      offset as number,
      limit as number
    );

    return res.status(200).send(response);
  },
]);

const getCampaignSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

router.get("/:campaignId", [
  useAuthenticateRequest(),
  useValidateRequest(getCampaignSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const { campaignId = 0 } = req.params;

    const response = await controller.getCampaign(
      res.locals.auth.userId,
      campaignId as number
    );
    return res.status(200).send(response);
  },
]);

const postCampaignSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rpgSystemCode: z.string(),
  publicAdventureId: z.string().optional(),
});

router.post("/", [
  useAuthenticateRequest(),
  useValidateRequest(postCampaignSchema),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const response = await controller.createCampaign(
      res.locals.auth.userId,
      req.body
    );
    return res.status(201).send(response);
  },
]);

const putCampaignIdSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

const putCampaignSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  rpgSystemCode: z.string(),
  publicAdventureCode: z.string().nullable().optional(),
});

router.put("/:campaignId", [
  useAuthenticateRequest(),
  useValidateRequest(putCampaignIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(putCampaignSchema),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const { campaignId = 0 } = req.params;

    const response = await controller.putCampaign(
      res.locals.auth.userId,
      campaignId as number,
      req.body
    );

    return res.status(200).send(response);
  },
]);

const deleteCampaignSchema = z.object({
  campaignId: z.coerce.number().default(0),
});

router.delete("/:campaignId", [
  useAuthenticateRequest(),
  useValidateRequest(deleteCampaignSchema, {
    validationType: ValidationTypes.Route,
  }),
  async (req: Request, res: Response) => {
    const controller = new CampaignController();

    const { campaignId = 0 } = req.params;

    const response = await controller.deleteCampaign(
      res.locals.auth.userId,
      campaignId as number
    );

    return res.status(200).send(response);
  },
]);

export default router;
