import { ConjurationsDataProvider } from './conjurations.dataprovider';
import { ConjurationsRelationshipsDataProvider } from './relationships/relationships.dataprovider';
import { MembersDataProvider } from '../campaigns/members/members.dataprovider';
import { UsersDataProvider } from '../users/users.dataprovider';
import { CollectionsDataProvider } from '../collections/collections.dataprovider';

import { TrackingInfo, AppEvent, track } from '../../lib/tracking';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { MythWeaverLogger } from '../../lib/logger';
import {
  Conjuration,
  ConjurationRelationshipType,
  ConjurationVisibility,
  BillingPlan,
  Image,
} from '@prisma/client';
import {
  PatchConjurationRequest,
  GetConjurationsResponse,
  GetConjurationTagsResponse,
  ConvertConjurationRequest,
} from './conjurations.interface';
import { ImageStylePreset } from '../images/images.interface';
import {
  validateConjurationCountRestriction,
  sendConjurationCountUpdatedEvent,
} from '../../lib/planRestrictionHelpers';
import { getCharacterCampaigns } from '../../lib/charactersHelper';
import { processTagsQueue } from '../../worker';

export class ConjurationsService {
  constructor(
    private conjurationsDataProvider: ConjurationsDataProvider,
    private conjurationsRelationshipsDataProvider: ConjurationsRelationshipsDataProvider,
    private membersDataProvider: MembersDataProvider,
    private usersDataProvider: UsersDataProvider,
    private collectionsDataProvider: CollectionsDataProvider,
    private logger: MythWeaverLogger,
  ) {}

  async getConjurations(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId?: number,
    saved?: boolean,
    conjurerCodeString?: string,
    stylePreset?: ImageStylePreset,
    tags?: string,
    offset?: number,
    limit?: number,
    history?: boolean,
    search?: string,
    nodeId?: number,
    nodeType?: ConjurationRelationshipType,
    collectionId?: number,
  ): Promise<GetConjurationsResponse> {
    const conjurations = await this.conjurationsDataProvider.getConjurations(
      userId,
      saved,
      conjurerCodeString,
      tags,
      offset,
      limit,
      history,
      search,
    );

    track(AppEvent.GetConjurations, userId, trackingInfo);

    let relationships = [] as any[];
    if (nodeId) {
      relationships =
        await this.conjurationsRelationshipsDataProvider.findManyConjurationRelationships(
          userId,
          nodeId,
          nodeType,
          conjurations?.map((c: Conjuration) => c.id),
        );
    }

    let collectionConjurations = [] as any[];
    if (collectionId) {
      collectionConjurations =
        await this.collectionsDataProvider.getCollectionConjurations(
          collectionId,
        );
    }

    return {
      data: conjurations.map((c: any) => ({
        ...c,
        saves: c.saves.length,
        saved: c.saves.some((s: any) => s.userId === userId),
        linked: relationships.length
          ? relationships.some(
              (r) =>
                r.nextNodeId === c.id &&
                r.nextType === ConjurationRelationshipType.CONJURATION,
            )
          : false,
        imageUri: c.images.find((i: any) => i.primary)?.uri || null,
        imageModelName:
          c.images.find((i: any) => i.primary)?.imageModel?.description || null,
        inCollection: collectionConjurations.some(
          (cc) => cc.conjurationId === c.id,
        ),
      })),
      offset: offset,
      limit: limit,
    };
  }

  async getConjuration(
    userId: number,
    trackingInfo: TrackingInfo,
    conjurationId: number,
  ): Promise<
    Conjuration & { saves: undefined; saved: boolean; campaignIds: number[] }
  > {
    const conjuration =
      await this.conjurationsDataProvider.findUniqueSavedConjuration(
        conjurationId,
        userId,
      );

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    let campaignIds = [] as number[];
    if (conjuration.conjurerCode === 'players') {
      const characterCampaigns = await getCharacterCampaigns(conjurationId);
      campaignIds = characterCampaigns.map((r: any) => r.id);
    }

    if (
      conjuration.visibility === ConjurationVisibility.PRIVATE &&
      conjuration.userId !== userId
    ) {
      if (
        conjuration.conjurerCode !== 'players' ||
        !(await this.membersDataProvider.findMemberOfCampaigns(
          userId,
          campaignIds,
        ))
      ) {
        throw new AppError({
          description: 'Conjuration not found.',
          httpCode: HttpCode.NOT_FOUND,
        });
      }
    }

    track(AppEvent.GetConjuration, userId, trackingInfo);

    return {
      ...conjuration,
      imageUri: conjuration.images.find((i: Image) => i.primary)?.uri || null,
      saves: undefined,
      saved: conjuration.saves.length > 0,
      campaignIds: campaignIds,
    };
  }

  async saveConjuration(
    userId: number,
    trackingInfo: TrackingInfo,
    conjurationId: number,
  ): Promise<void> {
    const existingConjuration =
      await this.conjurationsDataProvider.getConjurationById(conjurationId);

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

    await this.conjurationsDataProvider.upsertConjurationSave(
      userId,
      conjurationId,
    );

    await sendConjurationCountUpdatedEvent(userId);
  }

  async updateConjuration(
    userId: number,
    trackingInfo: TrackingInfo,
    conjurationId: number,
    request: PatchConjurationRequest,
  ): Promise<Conjuration> {
    const conjuration = await this.getConjuration(
      userId,
      trackingInfo,
      conjurationId,
    );

    if (conjuration.userId === null || conjuration.userId !== userId) {
      throw new AppError({
        description: 'You do not have access to modify this conjuration.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    const user = await this.usersDataProvider.getUserById(userId);

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (
      (user.plan === BillingPlan.FREE || user.plan === BillingPlan.TRIAL) &&
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

    const updatedConjuration =
      await this.conjurationsDataProvider.updateConjuration(conjurationId, {
        userId,
        ...request,
      });

    await processTagsQueue.add({
      conjurationIds: [conjurationId],
    });

    return updatedConjuration;
  }

  async deleteConjuration(
    userId: number,
    trackingInfo: TrackingInfo,
    conjurationId: number,
  ): Promise<boolean> {
    const conjuration = await this.getConjuration(
      userId,
      trackingInfo,
      conjurationId,
    );

    if (conjuration.userId === null || conjuration.userId !== userId) {
      throw new AppError({
        description: 'You do not have access to delete this conjuration.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    const saves =
      await this.conjurationsDataProvider.findManyConjurationSaves(
        conjurationId,
      );

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
      await this.conjurationsDataProvider.deleteConjurationSave(userSave.id);
    }

    await this.conjurationsRelationshipsDataProvider.deleteConjurationRelationships(
      conjurationId,
    );
    await this.conjurationsDataProvider.deleteConjuration(conjurationId);

    track(AppEvent.DeleteConjuration, userId, trackingInfo);

    await sendConjurationCountUpdatedEvent(userId);

    return true;
  }

  async getConjurationTags(
    userId: number,
    trackingInfo: TrackingInfo,
    term?: string,
    offset?: number,
    limit?: number,
  ): Promise<GetConjurationTagsResponse> {
    offset = offset || 0;
    limit = limit || 50;

    const tags = await this.conjurationsDataProvider.findManyTags(
      term,
      offset,
      limit,
    );

    track(AppEvent.GetConjurationTags, userId, trackingInfo);

    return {
      data: tags.map((t) => t.name),
      offset: offset,
      limit: limit,
    };
  }

  async removeConjuration(
    userId: number,
    trackingInfo: TrackingInfo,
    conjurationId: number,
  ): Promise<void> {
    const existingConjurationSave =
      await this.conjurationsDataProvider.findUniqueConjurationSave(
        userId,
        conjurationId,
      );

    if (!existingConjurationSave) {
      throw new AppError({
        description: 'Conjuration save not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.RemoveConjuration, userId, trackingInfo);

    await this.conjurationsDataProvider.deleteConjurationSave(
      existingConjurationSave.id,
    );

    await sendConjurationCountUpdatedEvent(userId);
  }

  async copyConjuration(
    userId: number,
    trackingInfo: TrackingInfo,
    conjurationId: number,
  ): Promise<Conjuration | null> {
    const existingConjuration =
      await this.conjurationsDataProvider.getConjurationById(conjurationId);

    if (!existingConjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    await validateConjurationCountRestriction(userId);

    track(AppEvent.CopyConjuration, userId, trackingInfo);

    const conjuration = await this.conjurationsDataProvider.createConjuration({
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
    });

    if (existingConjuration.images.length) {
      for (const img of existingConjuration.images) {
        await this.conjurationsDataProvider.createImage({
          ...img,
          id: undefined,
          imageModel: undefined,
          userId: userId,
          conjurationId: conjuration.id,
          edits: {},
        });
      }
    }

    await sendConjurationCountUpdatedEvent(userId);

    return this.conjurationsDataProvider.getConjurationById(conjuration.id);
  }

  async getConjurationRequest(
    userId: number,
    trackingInfo: TrackingInfo,
    requestId: number,
  ): Promise<Conjuration> {
    const conjuration = await this.conjurationsDataProvider.findUserConjuration(
      userId,
      requestId,
    );

    if (!conjuration) {
      throw new AppError({
        description: `Conjuration with requestId ${requestId} not found.`,
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    return conjuration;
  }

  async convertConjurationTypes(
    userId: number,
    request: ConvertConjurationRequest,
  ): Promise<Conjuration> {
    const conjuration = await this.conjurationsDataProvider.findUserConjuration(
      userId,
      request.conjurationId,
    );

    if (!conjuration) {
      throw new AppError({
        description: `Conjuration not found.`,
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    return this.conjurationsDataProvider.updateConjuration(conjuration.id, {
      conjurerCode: request.conjurerCode,
    });
  }
}
