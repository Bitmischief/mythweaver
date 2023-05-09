import {Body, Get, Inject, OperationId, Post, Query, Route, Security, Tags} from "tsoa";
import {prisma} from '../lib/providers/prisma';
import {Character, Dnd5eRandomStatSheet, RandomPersona} from "@prisma/client";
import {AppError} from "../lib/errors/AppError";

interface GetCharactersResponse {
  data: Character[];
  offset?: number;
  limit?: number;
}

interface PostCharactersRequest {
  name: string,
  race?: string;
  alignment?: string;
  class?: string;
  level?: number;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  hitPoints?: number;
  armorClass?: number;
  speed?: number;
}

export enum CharacterTypes {
  Dnd5e = 0,
}

@Route("characters")
@Tags("Characters")
export default class CharacterController {
  @Security("jwt")
  @OperationId("getCharacters")
  @Get("/")
  public async getCharacters(
    @Inject() userId: number,
    @Query() offset: number = 0,
    @Query() limit: number = 10,
  ): Promise<GetCharactersResponse> {
    const characters = await prisma.character.findMany({
      where: {
        OR: [
          {
            userId: null,
          },
          {
            userId,
          }
        ],
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
  @OperationId("createCharacter")
  @Post("/")
  public async postCharacters(
    @Inject() userId: number,
    @Body() request: PostCharactersRequest,
  ): Promise<Character> {
    const character = await prisma.character.create({
      data: {
        userId,
        name: request.name,
        type: (CharacterTypes.Dnd5e as number),
      }
    });

    const dnd5e = await prisma.dnd5e.create({
      data: {
        background: '',
        ...request,
      }
    });

    await prisma.character.update({
      where: {
        id: character.id,
      },
      data: {
        ...character,
        dnd5eId: dnd5e.id,
      }
    });

    return character;
  }

  @Security("jwt")
  @OperationId("generateCharacter")
  @Post("/generate")
  public async postGenerateCharacter(
    @Inject() userId: number,
    @Body() request: PostCharactersRequest,
  ): Promise<any> {
    const randomPersona = await getRandomPersona();
    const randomStatSheet = await getRandomStatSheet();

    return {
      ...randomPersona,
      ...randomStatSheet,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    }
  }
}

export const getRandomPersona = async (): Promise<RandomPersona> => {
  const personaCount = await prisma.randomPersona.count();
  const firstId = (await prisma.randomPersona.findFirst())?.id || 1;

  let randomPersona, tries = 0, maxTries = 50;
  do {
    const randomIndex = Math.floor(Math.random() * personaCount + 1);
    randomPersona = await prisma.randomPersona.findUnique({
      where: {
        id: randomIndex + firstId,
      },
    });

    tries++;
  } while(randomPersona === undefined && tries < maxTries);

  if (!randomPersona) {
    throw new AppError({
      httpCode: 500,
      description: 'Unable to generate random persona',
    })
  }

  return randomPersona;
}

export const getRandomStatSheet = async (): Promise<Dnd5eRandomStatSheet> => {
  const statSheetCount = await prisma.dnd5eRandomStatSheet.count();
  const firstId = (await prisma.dnd5eRandomStatSheet.findFirst())?.id || 1;

  let statSheet, tries = 0, maxTries = 50;
  do {
    const randomIndex = Math.floor(Math.random() * statSheetCount + 1);
    statSheet = await prisma.dnd5eRandomStatSheet.findUnique({
      where: {
        id: randomIndex + firstId,
      },
    });

    tries++;
  } while(!statSheet && tries < maxTries);

  if (!statSheet) {
    throw new AppError({
      httpCode: 500,
      description: 'Unable to generate random stat sheet',
    })
  }

  return statSheet;
}
