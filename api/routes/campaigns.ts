import express, { Request, Response } from "express";
import { useAuthenticateRequest } from "../lib/authMiddleware";
import { z } from "zod";
import {
  useValidateRequest,
  ValidationTypes,
} from "../lib/validationMiddleware";
import CharacterController from "../controllers/characters";
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
  characterId: z.coerce.number().default(0),
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
  rpgSystemId: z.coerce.number(),
  publicAdventureId: z.coerce.number().optional(),
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

export default router;
