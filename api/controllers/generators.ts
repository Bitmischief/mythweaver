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
  Patch,
} from "tsoa";
import { prisma } from "../lib/providers/prisma";
import { Campaign, Character } from "@prisma/client";
import { sanitizeJson } from "../lib/utils";
import { AppError, HttpCode } from "../lib/errors/AppError";
import { parentLogger } from "../lib/logger";
import { getClient } from "../lib/providers/openai";
import generators, {
  Generator,
  GeneratorResponse,
  getGenerator,
} from "../data/generators";
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
  customData?: any;
}

interface PostGenerateCharacterImageRequest {
  looks: string;
}

@Route("generators")
@Tags("Generators")
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
  ): GeneratorResponse | undefined {
    return getGenerator(code);
  }

  @Security("jwt")
  @OperationId("generateCharacterImage")
  @Post("/image")
  public async postGenerateCharacterImage(
    @Inject() userId: number,
    @Body() request: PostGenerateCharacterImageRequest
  ): Promise<any> {
    const prompt = `${request.looks}, medieval, digital art`;

    const response = await openai.createImage({
      prompt,
      n: 3,
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

    const prompt = buildPrompt(generator, campaign);

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
}

const buildPrompt = (generator: GeneratorResponse, campaign: Campaign) => {
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

  let prompt = `Please generate me 3 unique ${buildGeneratorPromptDescription(
    generator
  )} to be used in
  ${rpgSystem.name} for the campaign ${
    publicAdventure?.name
  }. Please focus on generating distinctly unique and different options. Please return
  JSON only so that I can easily deserialize into a javascript object. Use the
  following format.
  ${generator?.grandParent?.formatPrompt}.
  `;

  if (generator?.grandParent?.allowsImageGeneration) {
    prompt += `Please also generate a prompt to be used by an AI image generator to generate an image for this
       ${generator?.grandParent?.name} to be stored in the JSON property 'imageAIPrompt'. Please do not refer to the ${generator?.grandParent?.name} name in the prompt and use short, concise, clear statements describing the looks.`;
  }

  return prompt;
};

const buildGeneratorPromptDescription = (generator: GeneratorResponse) => {
  if (generator?.node.promptOverride) {
    return generator?.node.promptOverride;
  }

  let desc = "";
  let iteratingGenerator = generator as any;
  const hierarchicalNames = [];

  while (iteratingGenerator !== undefined) {
    hierarchicalNames.push(iteratingGenerator.name);
    iteratingGenerator = iteratingGenerator.parent;
  }

  hierarchicalNames.reverse();

  for (let i = 0; i < hierarchicalNames.length; i++) {
    const hierarchicalName = hierarchicalNames[i];

    if (i === 0) {
      desc += `${hierarchicalName} with `;
    } else {
      desc += ` sub-type: ${hierarchicalName}`;

      if (i + 1 !== hierarchicalNames.length) {
        desc += ", ";
      } else {
        desc += ".";
      }
    }
  }

  return desc;
};
