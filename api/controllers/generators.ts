import {
  Get,
  Route,
  Tags,
  Query,
  Path,
  Inject,
  Security,
  OperationId,
  Post,
  Body,
} from "tsoa";
import { prisma } from "../lib/providers/prisma";
import { Campaign, Character } from "@prisma/client";
import { sanitizeJson } from "../lib/utils";
import { AppError, HttpCode } from "../lib/errors/AppError";
import { parentLogger } from "../lib/logger";
import { getClient } from "../lib/providers/openai";
import generators, { Generator, getGenerator } from "../data/generators";
import { getRpgSystem } from "../data/rpgSystems";

const logger = parentLogger.getSubLogger();
const openai = getClient();

export interface GetGeneratorsResponse {
  data: any[];
  offset?: number;
  limit?: number;
}

export interface PostGeneratorGenerate {
  campaignId: number;
  customArgs?: CustomArg[];
}

export interface CustomArg {
  key: string;
  value: any;
}

interface PostGenerateCharacterImageRequest {
  looks: string;
}

@Route("generators")
@Tags("Summoning")
export class GeneratorController {
  @Get("/")
  @Security("jwt")
  @OperationId("getGenerators")
  public async getGenerators(
    @Inject() userId: number,
    @Query() parentId: number | null = null,
    @Query() offset = 0,
    @Query() limit = 50
  ): Promise<GetGeneratorsResponse> {
    const data = generators.slice(offset, offset + limit);

    return {
      data,
      offset,
      limit,
    };
  }

  @Get("/{code}")
  @Security("jwt")
  @OperationId("getGenerator")
  public getGenerator(
    @Inject() userId: number,
    @Path() code: string
  ): Generator | undefined {
    return getGenerator(code);
  }

  @Security("jwt")
  @OperationId("generateCharacterImage")
  @Post("/image")
  public async postGenerateCharacterImage(
    @Inject() userId: number,
    @Body() request: PostGenerateCharacterImageRequest
  ): Promise<any> {
    return await this.getImageForPrompt(request.looks, 3);
  }

  private async getImageForPrompt(prompt: string, count: number) {
    prompt = `${prompt}, medieval, digital art`;

    const response = await openai.createImage({
      prompt,
      n: count,
    });

    return response.data.data;
  }

  @Post("/{code}/generate")
  @Security("jwt")
  @OperationId("generate")
  public async postGeneratorGenerate(
    @Inject() userId: number,
    @Path() code: string,
    @Body() request: PostGeneratorGenerate
  ): Promise<Character> {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: request.campaignId,
      },
    });

    if (!campaign) {
      throw new AppError({
        description: "Campaign not found.",
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const generator = this.getGenerator(userId, code);

    if (!generator) {
      throw new AppError({
        description: "Generator not found.",
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const prompt = buildPrompt(generator, campaign, request.customArgs);

    let characters: any = undefined;

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
        characters = JSON.parse(charString || "");
      } catch (e) {
        logger.warn("Failed to parse character string", e, charString);
      }
    } while (!characters);

    const promises = characters.map((c: any) =>
      this.getImageForPrompt(c.imageAIPrompt, 1)
    );
    const results = await Promise.all(promises);

    for (let i = 0; i < characters.length; i++) {
      characters[i].imageUri = results[i][0]?.url;
    }

    return characters;
  }
}

const buildPrompt = (
  generator: Generator,
  campaign: Campaign,
  customArgs: CustomArg[] = []
) => {
  const rpgSystem = getRpgSystem(campaign.rpgSystemCode);
  const publicAdventure = rpgSystem?.publicAdventures?.find(
    (a) => a.code === campaign.publicAdventureCode
  );

  if (!rpgSystem) {
    throw new AppError({
      description: "RPG System not found.",
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

  let prompt = `Please generate me 3 unique ${generator.name.toLowerCase()} to be used in
  ${rpgSystem.name}`;

  if (publicAdventure) {
    prompt += `for the campaign ${publicAdventure?.name}. `;
  } else {
    prompt += ". ";
  }

  if (customArgs.length > 0) {
    prompt += `Please use the following parameters to guide generation: ${customArgs
      .map((a) => `${a.key}: ${a.value}`)
      .join(", ")}. `;
  }

  prompt += `Please focus on generating 3 distinctly unique and different ${generator.name.toLowerCase()}. Please return JSON only so that I can easily deserialize into a javascript object. Use the following format. ${
    generator.formatPrompt
  }.`;

  if (generator.allowsImageGeneration) {
    prompt += `Please also generate a prompt to be used by an AI image generator to generate an image for this ${generator.name} to be stored in the JSON property 'imageAIPrompt'. Please do not refer to the ${generator.name} name in the prompt and use short, concise, clear statements describing the looks.`;
  }

  logger.info("Built prompt", prompt);

  return prompt;
};
