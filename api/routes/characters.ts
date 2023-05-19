import express, {Request, Response} from "express";
import {useAuthenticateRequest} from "../lib/authMiddleware";
import {z} from "zod";
import {useValidateRequest, ValidationTypes} from "../lib/validationMiddleware";
import CharacterController from "../controllers/characters";

const router = express.Router();

const getCharactersSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(10).optional(),
});

router.get("/", [
  useAuthenticateRequest(),
  useValidateRequest(getCharactersSchema, { validationType: ValidationTypes.Query }),
  async (req: Request, res: Response) => {
    const controller = new CharacterController();

    const { offset = 0, limit = 10 } = req.query;

    const response = await controller.getCharacters(res.locals.auth.userId, offset as number, limit as number);
    return res.status(200).send(response);
  },
]);

const getCharacterSchema = z.object({
  characterId: z.coerce.number().default(0),
});

router.get("/:characterId", [
  useAuthenticateRequest(),
  useValidateRequest(getCharacterSchema, { validationType: ValidationTypes.Route }),
  async (req: Request, res: Response) => {
    const controller = new CharacterController();

    const { characterId = 0 } = req.params;

    const response = await controller.getCharacter(res.locals.auth.userId, characterId as number);
    return res.status(200).send(response);
  },
]);

const postCharactersSchema = z.object({
  name: z.string().optional(),
  looks: z.string().optional(),
  personality: z.string().optional(),
  background: z.string().optional(),
  imageUri: z.string().optional(),
});

router.post("/", [
  useAuthenticateRequest(),
  useValidateRequest(postCharactersSchema),
  async (req: Request, res: Response) => {
    const controller = new CharacterController();

    const response = await controller.postCharacters(res.locals.auth.userId, req.body);
    return res.status(201).send(response);
  },
]);

const postGenerateCharacterSchema = z.object({
  name: z.string().optional(),
  occupation: z.string().optional(),
});

router.post("/generate/base", [
  useAuthenticateRequest(),
  useValidateRequest(postGenerateCharacterSchema),
  async (req: Request, res: Response) => {
    const controller = new CharacterController();

    const response = await controller.postGenerateCharacter(res.locals.auth.userId, req.body);
    return res.status(200).send(response);
  },
]);

const postGenerateCharacterImageSchema = z.object({
  looks: z.string().min(0).max(2000),
});

router.post("/generate/image", [
  useAuthenticateRequest(),
  useValidateRequest(postGenerateCharacterImageSchema),
  async (req: Request, res: Response) => {
    const controller = new CharacterController();

    const response = await controller.postGenerateCharacterImage(res.locals.auth.userId, req.body);
    return res.status(200).send(response);
  },
]);

export default router;