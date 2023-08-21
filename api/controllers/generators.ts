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
import { Campaign, Conjuration } from "@prisma/client";
import { sanitizeJson } from "../lib/utils";
import { AppError, HttpCode } from "../lib/errors/AppError";
import { parentLogger } from "../lib/logger";
import { getClient } from "../lib/providers/openai";
import conjurers, { Generator, getGenerator } from "../data/conjurers";
import { getRpgSystem } from "../data/rpgSystems";
import { generateImage } from "../services/imageGeneration";
import { AppEvent, track, TrackingInfo } from "../lib/tracking";
import { processTagsQueue } from "../worker";

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
@Tags("Conjuration")
export class GeneratorController {
  @Get("/")
  @Security("jwt")
  @OperationId("getGenerators")
  public async getGenerators(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() offset = 0,
    @Query() limit = 50
  ): Promise<GetGeneratorsResponse> {
    const data = conjurers.slice(offset, offset + limit);

    track(AppEvent.GetConjurers, userId, trackingInfo);

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
    @Inject() trackingInfo: TrackingInfo,
    @Path() code: string
  ): Generator | undefined {
    track(AppEvent.GetConjurer, userId, trackingInfo);
    return getGenerator(code);
  }

  @Security("jwt")
  @OperationId("generateCharacterImage")
  @Post("/image")
  public async postGenerateCharacterImage(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostGenerateCharacterImageRequest
  ): Promise<any> {
    track(AppEvent.ConjureImage, userId, trackingInfo);
    return await getImageForPrompt(request.looks, 3);
  }

  @Post("/{code}/generate/quick")
  @Security("jwt")
  @OperationId("quickConjure")
  public async postGeneratorGenerateQuick(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() code: string
  ): Promise<Conjuration | null> {
    const validIdObjects = await prisma.conjuration.findMany({
      where: {
        conjurerCode: code,
        userId: null,
        copies: {
          none: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: 0,
      take: 1000,
    });
    const validIds = validIdObjects.map((obj) => obj.id);

    let randomConjuration: Conjuration | null = null;

    let tries = 0;
    const maxTries = 20;

    while (randomConjuration === null && tries < maxTries) {
      const idx = Math.floor(Math.random() * (validIds.length + 1));

      try {
        randomConjuration = await prisma.conjuration.findUnique({
          where: {
            id: validIds[idx],
          },
        });
      } catch {
        logger.warn("Failed to get random conjuration", idx, validIds);
      } finally {
        tries++;
      }
    }

    track(AppEvent.QuickConjure, userId, trackingInfo);

    return randomConjuration;
  }

  @Post("/{code}/generate")
  @Security("jwt")
  @OperationId("generate")
  public async postGeneratorGenerate(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() code: string,
    @Body() request: PostGeneratorGenerate
  ): Promise<any> {
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

    const generator = this.getGenerator(userId, trackingInfo, code);

    if (!generator) {
      throw new AppError({
        description: "Generator not found.",
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    track(AppEvent.Conjure, userId, trackingInfo);

    return await conjure(generator, request.customArgs, campaign);
  }
}

export const conjure = async (
  generator: Generator,
  customArgs: CustomArg[] = [],
  campaign?: Campaign | undefined
) => {
  const prompt = buildPrompt(generator, campaign, customArgs);

  let conjurations: any = undefined;

  do {
    let response: any;

    try {
      response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 3500,
      });
    } catch (err: any) {
      logger.error("Error generating character with openai", err.response.data);
    }

    if (!response) {
      throw new AppError({
        description: "Error generating character.",
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    const generatedJson = response.data.choices[0].text?.trim() || "";
    logger.info("Received json from openai", generatedJson);

    const charString = sanitizeJson(generatedJson);
    logger.info("Sanitized json from openai...", charString);

    try {
      conjurations = JSON.parse(charString || "");
    } catch (e) {
      logger.warn("Failed to parse character string", e, charString);
    }
  } while (!conjurations);

  const promises = conjurations.map((c: any) =>
    generateImage(c.imageAIPrompt, 1)
  );
  const results = await Promise.all(promises);

  for (let i = 0; i < conjurations.length; i++) {
    conjurations[i].imageUri = results[i][0];
  }

  const result = await prisma.$transaction(
    conjurations.map((c: any) =>
      prisma.conjuration.create({
        data: {
          name: c.name,
          data: {
            ...c,
            name: undefined,
            imageAIPrompt: undefined,
            imageUri: undefined,
            tags: undefined,
          },
          imageAIPrompt: c.imageAIPrompt,
          imageUri: c.imageUri,
          conjurerCode: generator.code || "",
          tags: [
            generator.code,
            ...(c.tags ? c.tags.map((t: string) => t.toLowerCase()) : []),
          ],
        },
      })
    )
  );

  await processTagsQueue.add({
    conjurationIds: result.map((r) => r.id),
  });
};

const buildPrompt = (
  generator: Generator,
  campaign?: Campaign | undefined,
  customArgs: CustomArg[] = []
) => {
  let prompt = `You are a master storyteller. Please generate me 3 unique ${generator.name.toLowerCase()}`;

  if (campaign) {
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

    prompt += ` to be used in ${rpgSystem.name}`;

    if (publicAdventure) {
      prompt += `for the campaign ${publicAdventure?.name}. `;
    } else {
      prompt += ". ";
    }
  } else {
    prompt += " to be used in a roleplaying game like dungeons and dragons. ";
  }

  if (customArgs.length > 0) {
    prompt += `Please use the following parameters to guide generation: ${customArgs
      .map((a) => `${a.key}: ${a.value}`)
      .join(", ")}. `;
  }

  prompt += `Please focus on generating 3 distinctly unique and different ${generator.name.toLowerCase()} with really engaging, immersive and compelling attributes. Please return JSON only so that I can easily deserialize into a javascript object. Use the following format. ${
    generator.formatPrompt
  }. `;

  if (generator.allowsImageGeneration) {
    prompt += `Please generate a prompt to be used by an AI image generator to generate an portrait image for this ${generator.name.toLowerCase()} to be stored in the JSON property 'imageAIPrompt'. ${
      generator.imagePromptExtraContext
    }. `;
  }

  if (generator.basePromptExtraContext) {
    prompt += generator.basePromptExtraContext;
  }

  logger.info("Built prompt", prompt);

  return prompt;
};

export const getImageForPrompt = async (prompt: string, count: number) => {
  prompt = `${prompt.replace(
    ".",
    ""
  )}, medieval, fantasy, portrait, oil painting style`;

  const response = await openai.createImage({
    prompt,
    n: count,
  });

  return response.data.data;
};
