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

const postCharactersSchema = z.object({
  name: z.string().optional(),
  race: z.string().optional(),
  class: z.string().optional(),
  alignment: z.string().optional(),
  level: z.coerce.number().min(1).max(20).default(1).optional(),
  strength: z.coerce.number().min(1).default(1).optional(),
  dexterity: z.coerce.number().min(1).default(1).optional(),
  constitution: z.coerce.number().min(1).default(1).optional(),
  intelligence: z.coerce.number().min(1).default(1).optional(),
  wisdom: z.coerce.number().min(1).default(1).optional(),
  charisma: z.coerce.number().min(1).default(1).optional(),
  hitPoints: z.coerce.number().min(1).default(1).optional(),
  armorClass: z.coerce.number().min(1).default(1).optional(),
  speed: z.coerce.number().min(1).default(1).optional(),
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
  race: z.string().optional(),
  class: z.string().optional(),
  background: z.string().optional(),
  level: z.coerce.number().min(1).max(20).default(1).optional(),
  personality: z.string().optional(),
});

router.post("/generate", [
  useAuthenticateRequest(),
  useValidateRequest(postGenerateCharacterSchema),
  async (req: Request, res: Response) => {
    const controller = new CharacterController();

    const response = await controller.postGenerateCharacter(res.locals.auth.userId, req.body);
    return res.status(200).send(response);
  },
]);

export default router;