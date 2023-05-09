import AuthController from "../controllers/auth";
import express, {Request, Response} from "express";
import {useValidateRequest} from "../lib/validationMiddleware";
import {z} from "zod";
const router = express.Router();

const postTokenSchema = z.object({
  type: z.string(),
  credential: z.string(),
});

router.post("/token", [
  useValidateRequest(postTokenSchema),
  async (req: Request, res: Response) => {
    const controller = new AuthController();
    const response = await controller.postToken(req.body);
    return res.send(response);
  }
]);

const postRefreshSchema = z.object({
  refreshToken: z.string(),
});

router.post("/refresh", [
  useValidateRequest(postRefreshSchema),
  async (req: Request, res: Response) => {
    const controller = new AuthController();
    const response = await controller.postRefresh(req.body);
    return res.send(response);
  }
]);

export default router;