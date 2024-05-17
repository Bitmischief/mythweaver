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
import {
  Conjuration,
  ConjurationRelationshipType,
  ConjurationVisibility,
  BillingPlan,
} from '@prisma/client';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import { processTagsQueue } from '../worker';
import { ImageStylePreset } from './images';
import { MythWeaverLogger } from '../lib/logger';
import {
  validateConjurationCountRestriction,
  sendConjurationCountUpdatedEvent,
} from '../lib/planRestrictionHelpers';

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
    @Query() history?: boolean,
    @Query() search?: string,
    @Query() nodeId?: number,
    @Query() nodeType?: ConjurationRelationshipType,
  ): Promise<GetConjurationsResponse> {
    const conjurerCodes = conjurerCodeString
      ?.split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const orClause = [];
    if (tags) {
      orClause.push({
        tags: {
          hasEvery: tags.split(',').map((t) => t.trim()),
        },
      });
    }
    if (search) {
      orClause.push({
        name: {
          search: search.replaceAll(/\s/g, ' | '),
        },
      });
      const t = search.toLowerCase().split(/\s/g);
      t.forEach((tag) => {
        orClause.push({
          tags: {
            has: tag,
          },
        });
      });
    }

    const conjurations = await prisma.conjuration.findMany({
      where: {
        saves: history
          ? undefined
          : saved
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
        userId: history ? userId : undefined,
        visibility: saved || history ? undefined : ConjurationVisibility.PUBLIC,
        images: !saved ? { some: { primary: true } } : undefined,
        OR: orClause.length ? orClause : undefined,
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        saves: true,
        images: {
          where: {
            primary: true,
          },
        },
      },
    });

    track(AppEvent.GetConjurations, userId, trackingInfo);

    let relationships = [] as any[];
    if (nodeId) {
      relationships = await prisma.conjurationRelationships.findMany({
        where: {
          previousNodeId: nodeId,
          previousType: nodeType,
          userId: userId,
          nextNodeId: {
            in: conjurations.map((c: Conjuration) => c.id),
          },
          nextType: ConjurationRelationshipType.CONJURATION,
        },
      });
    }

    return {
      data: conjurations.map((c) => ({
        ...c,
        saves: c.saves.length,
        saved: c.saves.some((s) => s.userId === userId),
        linked: relationships.length
          ? relationships.some(
              (r) =>
                r.nextNodeId === c.id &&
                r.nextType === ConjurationRelationshipType.CONJURATION,
            )
          : false,
        imageUri: c.images.find((i) => i.primary)?.uri || null,
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
        images: {
          where: {
            primary: true,
          },
        },
      },
    });

    if (
      !conjuration ||
      (conjuration.visibility === ConjurationVisibility.PRIVATE &&
        conjuration.userId !== userId)
    ) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.GetConjuration, userId, trackingInfo);

    return {
      ...conjuration,
      imageUri: conjuration.images.find((i) => i.primary)?.uri || null,
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
      existingConjuration.visibility === ConjurationVisibility.PRIVATE &&
      existingConjuration.userId !== userId
    ) {
      throw new AppError({
        description: 'You cannot save this conjuration!',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    if (existingConjuration.userId !== userId) {
      await validateConjurationCountRestriction(userId);
    }

    track(AppEvent.SaveConjuration, userId, trackingInfo);

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

    await sendConjurationCountUpdatedEvent(userId);
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

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (
      user.plan === BillingPlan.FREE &&
      conjuration.visibility === ConjurationVisibility.PUBLIC &&
      request.visibility === ConjurationVisibility.PRIVATE
    ) {
      throw new AppError({
        description:
          'You cannot make this conjuration private. You must subscribe to our basic or pro plan!',
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

    const saves = await prisma.conjurationSave.findMany({
      where: {
        conjurationId,
      },
    });

    const userSave = saves.find((s) => s.userId === userId);
    const otherSaves = saves.filter((s) => s.userId !== userId);

    if (otherSaves.length > 0) {
      throw new AppError({
        description:
          'You cannot delete this conjuration! It has been saved by other users.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    if (userSave) {
      await prisma.conjurationSave.delete({
        where: {
          id: userSave.id,
        },
      });
    }

    await prisma.conjurationRelationships.deleteMany({
      where: {
        OR: [
          {
            nextNodeId: conjurationId,
          },
          {
            previousNodeId: conjurationId,
          },
        ],
      },
    });

    await prisma.conjuration.delete({
      where: {
        id: conjurationId,
      },
    });

    track(AppEvent.DeleteConjuration, userId, trackingInfo);
    await sendConjurationCountUpdatedEvent(userId);

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

    await sendConjurationCountUpdatedEvent(userId);
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
      include: {
        images: {
          where: {
            primary: true,
          },
        },
      },
    });

    if (!existingConjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    await validateConjurationCountRestriction(userId);

    track(AppEvent.CopyConjuration, userId, trackingInfo);

    const conjuration = await prisma.conjuration.create({
      data: {
        ...existingConjuration,
        id: undefined,
        data: existingConjuration.data as any,
        dataBackup: existingConjuration.dataBackup as any,
        visibility: ConjurationVisibility.PRIVATE,
        userId,
        saves: {
          create: {
            userId,
          },
        },
        createdAt: undefined,
        updatedAt: undefined,
        images: undefined,
      },
    });

    if (existingConjuration.images.length) {
      for (const img of existingConjuration.images) {
        await prisma.image.create({
          data: {
            ...img,
            id: undefined,
            userId: userId,
            conjurationId: conjuration.id,
          },
        });
      }
    }

    await sendConjurationCountUpdatedEvent(userId);

    return prisma.conjuration.findUnique({
      where: {
        id: conjuration.id,
      },
      include: {
        saves: true,
        images: {
          where: {
            primary: true,
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
