import { prisma } from './providers/prisma';

export const getCampaignCharacters = async (campaignId: number) => {
  return prisma.conjuration.findMany({
    where: {
      conjurerCode: 'players',
      campaignConjuration: {
        some: {
          campaignId,
        },
      },
    },
    include: {
      images: {
        where: {
          primary: true,
        },
      },
      user: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
};

export const getCharacterCampaigns = async (characterId: number) => {
  return prisma.campaign.findMany({
    where: {
      campaignConjurations: {
        some: {
          conjurationId: characterId,
          conjuration: {
            conjurerCode: 'players',
          },
        },
      },
    },
  });
};
