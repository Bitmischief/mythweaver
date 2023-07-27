import express, { Request, Response } from "express";
import { useAuthenticateRequest } from "../lib/authMiddleware";
import { z } from "zod";
import {
  useValidateRequest,
  ValidationTypes,
} from "../lib/validationMiddleware";
import { RpgSystemController } from "../controllers/rpgSystems";

const router = express.Router();

const getRpgSystemsSchema = z.object({
  term: z.string().optional(),
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
});

router.get("/", [
  useAuthenticateRequest(),
  useValidateRequest(getRpgSystemsSchema, {
    validationType: ValidationTypes.Query,
  }),
  async (req: Request, res: Response) => {
    const controller = new RpgSystemController();

    const { term, offset = 0, limit = 10 } = req.query;

    const response = await controller.getRpgSystems(
      res.locals.auth.userId,
      term as string,
      offset as number,
      limit as number
    );

    return res.status(200).send(response);
  },
]);

export default router;
