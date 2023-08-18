import express, { Request, Response } from "express";
import { useAuthenticateRequest } from "../lib/authMiddleware";
import { z } from "zod";
import {
  useValidateRequest,
  ValidationTypes,
} from "../lib/validationMiddleware";
import UserController from "../controllers/users";

const router = express.Router();

router.get("/me", [
  useAuthenticateRequest(),
  async (req: Request, res: Response) => {
    const controller = new UserController();

    const response = await controller.getUser(res.locals.auth.userId);
    return res.status(200).send(response);
  },
]);

const patchUsersSchema = z.object({
  name: z.string().optional(),
  imageUri: z.string().optional(),
  tags: z.array(z.string()).optional(),
  data: z.array(z.object({ key: z.string(), value: z.any() })).optional(),
});

router.patch("/me", [
  useAuthenticateRequest(),
  useValidateRequest(patchUsersSchema),
  async (req: Request, res: Response) => {
    const controller = new UserController();

    const response = await controller.patchUser(
      res.locals.auth.userId,
      req.body
    );
    return res.status(200).send(response);
  },
]);

export default router;
