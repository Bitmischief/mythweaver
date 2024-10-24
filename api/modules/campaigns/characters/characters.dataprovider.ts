import { prisma } from '../../../lib/providers/prisma';
import { Character } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class CharactersDataProvider {
  async getCampaignCharacters(
    characterId: number,
    campaignId: number,
  ): Promise<Prisma.CharacterGetPayload<{ include: { images: true } }> | null> {
    return await prisma.character.findUnique({
      where: {
        id: characterId,
        campaignId: campaignId,
      },
      include: {
        images: {
          where: {
            primary: true,
          },
        },
      },
    });
  }
}
