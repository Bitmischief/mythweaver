import { AppError, HttpCode } from '@/lib/errors/AppError';
import { AppEvent, track, TrackingInfo } from '@/lib/tracking';
import { CharactersDataProvider } from '@/modules/characters/characters.dataprovider';
import {
  PostCharactersRequest,
  PatchCharactersRequest,
} from '@/modules/characters/characters.interface';
import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';

export class CharactersService {
  constructor(
    private charactersDataProvider: CharactersDataProvider,
    private membersDataProvider: MembersDataProvider,
  ) {}

  async createCharacter(
    userId: number,
    trackingInfo: TrackingInfo,
    request: PostCharactersRequest,
  ): Promise<any> {
    const campaignMember = await this.membersDataProvider.getCampaignMember(
      userId,
      request.campaignId,
    );

    if (!campaignMember) {
      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description:
          'You must be a member of the campaign to create a character.',
      });
    }

    const character = await this.charactersDataProvider.createCharacter({
      userId,
      campaignMemberId: campaignMember.id,
      ...request,
    });

    track(AppEvent.CreateCharacter, userId, trackingInfo);

    return character;
  }

  async updateCharacter(
    userId: number,
    trackingInfo: TrackingInfo,
    characterId: number,
    request: PatchCharactersRequest,
  ): Promise<any> {
    const character =
      await this.charactersDataProvider.getCharacter(characterId);

    if (!character || character.userId !== userId) {
      throw new AppError({
        httpCode: HttpCode.NOT_FOUND,
        description: 'Character not found.',
      });
    }

    const updatedCharacter = await this.charactersDataProvider.updateCharacter(
      characterId,
      request,
    );

    track(AppEvent.UpdateCharacter, userId, trackingInfo);

    return updatedCharacter;
  }

  async deleteCharacter(
    userId: number,
    trackingInfo: TrackingInfo,
    characterId: number,
  ): Promise<void> {
    const character =
      await this.charactersDataProvider.getCharacter(characterId);

    if (!character || character.userId !== userId) {
      throw new AppError({
        httpCode: HttpCode.NOT_FOUND,
        description: 'Character not found.',
      });
    }

    await this.charactersDataProvider.deleteCharacter(characterId);

    track(AppEvent.DeleteCharacter, userId, trackingInfo, {
      characterId: characterId,
    });
  }
}
