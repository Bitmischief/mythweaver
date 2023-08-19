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
import { Conjuration } from "@prisma/client";
import { AppError, HttpCode } from "../lib/errors/AppError";

interface GetConjurationsResponse {
  data: Conjuration[];
  offset?: number;
  limit?: number;
}

interface GetConjurationTagsResponse {
  data: string[];
  offset?: number;
  limit?: number;
}

interface PostConjurationsRequest {
  campaignId: number;
  conjurationId: number;
}

interface PatchConjurationRequest {
  campaignId: number;
  name: string;
  imageUri?: string;
  data: any;
  tags?: string[];
}

@Route("conjurations")
@Tags("Conjurations")
export default class ConjurationController {
  @Security("jwt")
  @OperationId("getConjurations")
  @Get("/")
  public async getConjurations(
    @Inject() userId: number,
    @Query() campaignId?: number,
    @Query() mine?: boolean,
    @Query() conjurerCodeString?: string,
    @Query() tags?: string,
    @Query() offset?: number,
    @Query() limit?: number
  ): Promise<GetConjurationsResponse> {
    const conjurerCodes = conjurerCodeString
      ?.split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const conjurations = await prisma.conjuration.findMany({
      where: {
        userId: mine ? userId : null,
        campaignId: mine ? campaignId : undefined,
        conjurerCode: conjurerCodes?.length
          ? {
              in: conjurerCodes,
            }
          : undefined,
        OR: tags
          ? [
              {
                tags: tags
                  ? {
                      hasEvery: tags.split(",").map((t) => t.trim()),
                    }
                  : undefined,
              },
            ]
          : undefined,
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        copies: {
          where: {
            userId: userId,
          },
          select: {
            id: true,
          },
        },
      },
    });

    return {
      data: conjurations,
      offset: offset,
      limit: limit,
    };
  }

  @Security("jwt")
  @OperationId("getConjuration")
  @Get("/:conjurationId")
  public async getConjuration(
    @Inject() userId: number,
    @Route() conjurationId = 0
  ): Promise<Conjuration> {
    const conjuration = await prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
      },
      include: {
        copies: {
          where: {
            userId: userId,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!conjuration) {
      throw new AppError({
        description: "Conjuration not found.",
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    return conjuration;
  }

  @Security("jwt")
  @OperationId("createConjuration")
  @Post("/")
  public async postConjurations(
    @Inject() userId: number,
    @Body() request: PostConjurationsRequest
  ): Promise<void> {
    const existingConjuration = await prisma.conjuration.findUnique({
      where: {
        id: request.conjurationId,
      },
    });

    if (!existingConjuration) {
      throw new AppError({
        description: "Conjuration not found.",
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (existingConjuration.userId !== null) {
      throw new AppError({
        description: "You cannot add this conjuration!",
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    await prisma.conjuration.create({
      data: {
        ...existingConjuration,
        id: undefined,
        data: existingConjuration.data as any,
        originalId: existingConjuration.id,
        userId,
        campaignId: request.campaignId,
      },
    });
  }

  @Security("jwt")
  @OperationId("updateConjuration")
  @Patch("/:conjurationId")
  public async patchConjuration(
    @Inject() userId: number,
    @Route() conjurationId: number,
    @Body() request: PatchConjurationRequest
  ): Promise<Conjuration> {
    const conjuration = await this.getConjuration(userId, conjurationId);

    if (conjuration.userId === null || conjuration.userId !== userId) {
      throw new AppError({
        description: "You do not have access to modify this conjuration.",
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    return prisma.conjuration.update({
      where: {
        id: conjurationId,
      },
      data: {
        userId,
        ...request,
      },
    });
  }

  @Security("jwt")
  @OperationId("deleteConjuration")
  @Delete("/:conjurationId")
  public async deleteConjuration(
    @Inject() userId: number,
    @Route() conjurationId: number
  ): Promise<boolean> {
    const conjuration = await this.getConjuration(userId, conjurationId);

    if (conjuration.userId === null || conjuration.userId !== userId) {
      throw new AppError({
        description: "You do not have access to delete this conjuration.",
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    await prisma.conjuration.delete({
      where: {
        id: conjurationId,
      },
    });

    return true;
  }

  @Security("jwt")
  @OperationId("getConjurationTags")
  @Get("/tags")
  public async getConjurationTags(
    @Inject() userId: number,
    @Query() term?: string,
    @Query() offset?: number,
    @Query() limit?: number
  ): Promise<GetConjurationTagsResponse> {
    offset = offset || 0;
    limit = limit || 50;

    const tags = await prisma.conjuration.findMany({
      select: {
        tags: true,
      },
    });

    const arrayTags = tags
      .map((t) => t.tags)
      .filter((t) => t !== null) as string[][];
    const flatTags = arrayTags.flat().filter((t) => t.includes(term || ""));
    const uniqueTags = [...new Set(flatTags)].slice(offset, offset + limit);

    return {
      data: uniqueTags,
      offset: offset,
      limit: limit,
    };
  }
}
