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
import { AppError, HttpCode } from "../lib/errors/AppError";
import { generatedImageQueue } from "../worker";

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
  @OperationId("updateCharacter")
  @Patch("/:characterId")
  public async patchCharacter(
    @Inject() userId: number,
    @Route() characterId: number,
    @Body() request: PatchCharacterRequest
  ): Promise<Character> {
    await this.getCharacter(userId, characterId);

    const character = await prisma.character.update({
      where: {
        id: characterId,
      },
      data: {
        userId,
        ...request,
      },
    });

    // if image is stored by openai, we need to download and store ourselves
    // or the image won't be available after a while
    if (character.imageUri?.startsWith("https://oaidalleapiprodscus")) {
      await generatedImageQueue.add({
        character,
      });
    }

    return character;
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
