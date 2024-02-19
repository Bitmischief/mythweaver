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
} from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { Conjuration, ConjurationVisibility } from '@prisma/client';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import { processTagsQueue } from '../worker';
import { ImageStylePreset } from './images';
import { MythWeaverLogger } from '../lib/logger';

interface GetConjurationsResponse {
  data: (Conjuration & { saved: boolean })[];
  offset?: number;
  limit?: number;
}

interface GetConjurationTagsResponse {
  data: string[];
  offset?: number;
  limit?: number;
}

interface PatchConjurationRequest {
  campaignId: number;
  name: string;
  imageUri?: string;
  data: any;
  tags?: string[];
  visibility?: ConjurationVisibility;
}

@Route('conjurations')
@Tags('Conjurations')
export default class ConjurationController {
  @Security('jwt')
  @OperationId('getConjurations')
  @Get('/')
  public async getConjurations(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Query() campaignId?: number,
    @Query() saved?: boolean,
    @Query() conjurerCodeString?: string,
    @Query() stylePreset?: ImageStylePreset,
    @Query() tags?: string,
    @Query() offset?: number,
    @Query() limit?: number,
  ): Promise<GetConjurationsResponse> {
    const conjurerCodes = conjurerCodeString
      ?.split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const conjurations = await prisma.conjuration.findMany({
      where: {
        saves: saved
          ? {
              some: {
                userId,
              },
            }
          : undefined,
        conjurerCode: conjurerCodes?.length
          ? {
              in: conjurerCodes,
            }
          : undefined,
        published: true,
        visibility: saved ? undefined : ConjurationVisibility.PUBLIC,
        images: stylePreset
          ? {
              some: {
                stylePreset: stylePreset,
              },
            }
          : undefined,
        OR: tags
          ? [
              {
                tags: tags
                  ? {
                      hasEvery: tags.split(',').map((t) => t.trim()),
                    }
                  : undefined,
              },
            ]
          : undefined,
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        saves: {
          where: {
            userId,
          },
        },
      },
    });

    track(AppEvent.GetConjurations, userId, trackingInfo);

    return {
      data: conjurations.map((c) => ({
        ...c,
        saves: undefined,
        saved: c.saves.length > 0,
      })),
      offset: offset,
      limit: limit,
    };
  }

  @Security('jwt')
  @OperationId('getConjuration')
  @Get('/:conjurationId')
  public async getConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() conjurationId = 0,
  ): Promise<Conjuration & { saves: undefined; saved: boolean }> {
    const conjuration = await prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
      },
      include: {
        saves: {
          where: {
            userId,
          },
        },
      },
    });

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.GetConjuration, userId, trackingInfo);

    return {
      ...conjuration,
      saves: undefined,
      saved: conjuration.saves.length > 0,
    };
  }

  @Security('jwt')
  @OperationId('saveConjuration')
  @Post('/:conjurationId/save')
  public async postSaveConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() conjurationId: number,
  ): Promise<void> {
    const existingConjuration = await prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
      },
    });

    if (!existingConjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (
      !existingConjuration.published &&
      existingConjuration.userId !== userId
    ) {
      throw new AppError({
        description: 'You cannot save this conjuration!',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.SaveConjuration, userId, trackingInfo);

    await prisma.conjuration.update({
      where: {
        id: conjurationId,
      },
      data: {
        published: true,
      },
    });

    await prisma.conjurationSave.upsert({
      where: {
        userId_conjurationId: {
          userId,
          conjurationId,
        },
      },
      create: {
        userId,
        conjurationId,
      },
      update: {
        userId,
        conjurationId,
      },
    });
  }

  @Security('jwt')
  @OperationId('updateConjuration')
  @Patch('/:conjurationId')
  public async patchConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() conjurationId: number,
    @Body() request: PatchConjurationRequest,
  ): Promise<Conjuration> {
    const conjuration = await this.getConjuration(
      userId,
      trackingInfo,
      logger,
      conjurationId,
    );

    if (conjuration.userId === null || conjuration.userId !== userId) {
      throw new AppError({
        description: 'You do not have access to modify this conjuration.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.UpdateConjuration, userId, trackingInfo);

    const updatedConjuration = prisma.conjuration.update({
      where: {
        id: conjurationId,
      },
      data: {
        userId,
        ...request,
      },
    });

    await processTagsQueue.add({
      conjurationIds: [conjurationId],
    });

    return updatedConjuration;
  }

  @Security('jwt')
  @OperationId('deleteConjuration')
  @Delete('/:conjurationId')
  public async deleteConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() conjurationId: number,
  ): Promise<boolean> {
    const conjuration = await this.getConjuration(
      userId,
      trackingInfo,
      logger,
      conjurationId,
    );

    if (conjuration.userId === null || conjuration.userId !== userId) {
      throw new AppError({
        description: 'You do not have access to delete this conjuration.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.DeleteConjuration, userId, trackingInfo);

    await prisma.conjuration.delete({
      where: {
        id: conjurationId,
      },
    });

    return true;
  }

  @Security('jwt')
  @OperationId('getConjurationTags')
  @Get('/tags')
  public async getConjurationTags(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Query() term?: string,
    @Query() offset?: number,
    @Query() limit?: number,
  ): Promise<GetConjurationTagsResponse> {
    offset = offset || 0;
    limit = limit || 50;

    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: term,
        },
      },
      orderBy: {
        usageCount: 'desc',
      },
      skip: offset,
      take: limit,
    });

    track(AppEvent.GetConjurationTags, userId, trackingInfo);

    return {
      data: tags.map((t) => t.name),
      offset: offset,
      limit: limit,
    };
  }

  @Security('jwt')
  @OperationId('removeConjuration')
  @Post('/:conjurationId/remove')
  public async postRemoveConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() conjurationId: number,
  ): Promise<void> {
    const existingConjurationSave = await prisma.conjurationSave.findUnique({
      where: {
        userId_conjurationId: {
          userId,
          conjurationId,
        },
      },
    });

    if (!existingConjurationSave) {
      throw new AppError({
        description: 'Conjuration save not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.RemoveConjuration, userId, trackingInfo);

    await prisma.conjurationSave.delete({
      where: {
        id: existingConjurationSave.id,
      },
    });
  }

  @Security('jwt')
  @OperationId('copyConjuration')
  @Post('/:conjurationId/copy')
  public async postCopyConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() conjurationId: number,
  ): Promise<any> {
    const existingConjuration = await prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
      },
    });

    if (!existingConjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.CopyConjuration, userId, trackingInfo);

    return prisma.conjuration.create({
      data: {
        ...existingConjuration,
        id: undefined,
        data: existingConjuration.data as any,
        userId,
        saves: {
          create: {
            userId,
          },
        },
      },
    });
  }

  @Security('jwt')
  @OperationId('getConjurationRequest')
  @Get('/request/:requestId')
  public async getConjurationRequest(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() requestId: number,
  ): Promise<any> {
    const conjuration = await prisma.conjuration.findFirst({
      where: {
        userId: userId,
        conjurationRequestId: requestId,
      },
    });

    console.log('CONJURATION:::::', conjuration);

    if (!conjuration) {
      throw new AppError({
        description: `Conjuration with requestId ${requestId} not found.`,
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    return conjuration;
  }
}
