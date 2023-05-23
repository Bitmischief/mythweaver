import {
  Body,
  Delete,
  Get,
  Inject,
  OperationId,
  Patch,
  Post,
  Query,
  Route,
  Security,
  Tags,
} from "tsoa";
import { prisma } from "../lib/providers/prisma";
import { Character } from "@prisma/client";
import { getClient } from "../lib/providers/openai";
import { parentLogger } from "../lib/logger";
import { sanitizeJson } from "../lib/utils";
import { AppError, HttpCode } from "../lib/errors/AppError";

const logger = parentLogger.getSubLogger();
const openai = getClient();

interface GetCharactersResponse {
  data: Character[];
  offset?: number;
  limit?: number;
}

interface PostCharactersRequest {
  name: string;
  looks: string;
  personality: string;
  background: string;
  imageUri?: string;
  quests?: string[];
  tags?: string[];
}

interface PostGenerateCharacterBaseRequest {
  name?: string;
  occupation?: string;
}

interface PostGenerateCharacterImageRequest {
  looks: string;
}

interface PatchCharacterRequest {
  name: string;
  looks: string;
  personality: string;
  background: string;
  imageUri?: string;
  quests?: string[];
  tags?: string[];
}

@Route("characters")
@Tags("Characters")
export default class CharacterController {
  @Security("jwt")
  @OperationId("getCharacters")
  @Get("/")
  public async getCharacters(
    @Inject() userId: number,
    @Query() term?: string,
    @Query() offset?: number,
    @Query() limit?: number
  ): Promise<GetCharactersResponse> {
    const characters = await prisma.character.findMany({
      where: {
        userId,
        OR: term
          ? [
              {
                name: term
                  ? {
                      contains: term,
                      mode: "insensitive",
                    }
                  : undefined,
              },
              {
                tags: term
                  ? {
                      hasSome: [term],
                    }
                  : undefined,
              },
            ]
          : undefined,
      },
      skip: offset,
      take: limit,
    });

    return {
      data: characters,
      offset: offset,
      limit: limit,
    };
  }

  @Security("jwt")
  @OperationId("getCharacter")
  @Get("/:characterId")
  public async getCharacter(
    @Inject() userId: number,
    @Route() characterId = 0
  ): Promise<Character> {
    const character = await prisma.character.findUnique({
      where: {
        id: characterId,
      },
    });

    if (!character) {
      throw new AppError({
        description: "Character not found.",
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (character.userId !== null && character.userId !== userId) {
      throw new AppError({
        description: "You do not have access to this character.",
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    return character;
  }

  @Security("jwt")
  @OperationId("createCharacter")
  @Post("/")
  public async postCharacters(
    @Inject() userId: number,
    @Body() request: PostCharactersRequest
  ): Promise<Character> {
    return prisma.character.create({
      data: {
        userId,
        ...request,
      },
    });
  }

  @Security("jwt")
  @OperationId("generateCharacterBase")
  @Post("/generate/base")
  public async postGenerateCharacter(
    @Inject() userId: number,
    @Body() request: PostGenerateCharacterBaseRequest
  ): Promise<any> {
    let prompt = `Please generate me a character to be used in a 
    roleplaying game such as dungeons and dragons. I would like the name, 
    looks, personality and background of the character return in the following 
    JSON format. Make sure to wrap any quotes in the generated text with a backslash.
    Please return JSON only so that I can easily deserialize into a javascript object.
    
    { 
      "name": "", 
      "looks": "", 
      "personality": "",
      "background": ""
    }
    `;

    if (request.name || request.occupation) {
      prompt +=
        "\n\nUse the following information to help generate the character.";
    }

    if (request.name) {
      prompt += `\n\nName: ${request.name}`;
    }

    if (request.occupation) {
      prompt += `\n\nOccupation: ${request.occupation}`;
    }

    let character: any = undefined;

    do {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 2000,
      });

      const generatedJson = response.data.choices[0].text?.trim() || "";
      logger.info("Received json from openai", generatedJson);

      const charString = sanitizeJson(generatedJson);
      logger.info("Sanitized json from openai...", charString);

      try {
        character = JSON.parse(charString || "");
      } catch (e) {
        logger.warn("Failed to parse character string", e, charString);
      }
    } while (!character);

    return character;
  }

  @Security("jwt")
  @OperationId("generateCharacterImage")
  @Post("/generate/image")
  public async postGenerateCharacterImage(
    @Inject() userId: number,
    @Body() request: PostGenerateCharacterImageRequest
  ): Promise<any> {
    const prompt =
      `Generate a fantasy style character portrait based on the following looks: ` +
      request.looks;

    const response = await openai.createImage({
      prompt,
    });

    return response.data.data;
  }

  @Security("jwt")
  @OperationId("updateCharacter")
  @Patch("/:characterId")
  public async patchCharacter(
    @Inject() userId: number,
    @Route() characterId: number,
    @Body() request: PatchCharacterRequest
  ): Promise<Character> {
    await this.getCharacter(userId, characterId);

    return prisma.character.update({
      where: {
        id: characterId,
      },
      data: {
        userId,
        ...request,
      },
    });
  }

  @Security("jwt")
  @OperationId("deleteCharacter")
  @Delete("/:characterId")
  public async deleteCharacter(
    @Inject() userId: number,
    @Route() characterId: number
  ): Promise<boolean> {
    await this.getCharacter(userId, characterId);

    await prisma.character.delete({
      where: {
        id: characterId,
      },
    });

    return true;
  }
}
