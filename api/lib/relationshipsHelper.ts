import { prisma } from './providers/prisma';
import { ConjurationRelationshipType } from '@prisma/client';

export const getCampaignCharacters = async (campaignId: number) => {
  const relationships = await prisma.conjurationRelationships.findMany({
    where: {
      previousNodeId: campaignId,
      previousType: ConjurationRelationshipType.CAMPAIGN,
      nextType: ConjurationRelationshipType.CHARACTER,
    },
  });

  return prisma.conjuration.findMany({
    where: {
      conjurerCode: 'players',
      id: {
        in: relationships.map((c) => c.nextNodeId),
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
  });
};

export const getCharacterCampaigns = async (characterId: number) => {
  const characterCampaigns = await prisma.conjurationRelationships.findMany({
    where: {
      previousType: ConjurationRelationshipType.CAMPAIGN,
      nextNodeId: characterId,
      nextType: ConjurationRelationshipType.CHARACTER,
    },
  });
  return prisma.campaign.findMany({
    where: {
      id: {
        in: characterCampaigns.map((c) => c.previousNodeId),
      },
    },
  });
};

export const getRelationships = async (
  previousNodeId: number,
  previousType: ConjurationRelationshipType,
  nextNodeId: number,
  nextType: ConjurationRelationshipType,
  userId?: number,
) => {
  return prisma.conjurationRelationships.findMany({
    where: {
      previousNodeId,
      previousType,
      nextNodeId,
      nextType,
      userId,
    },
  });
};

export const getManyRelationships = async (
  previousNodeId: number,
  previousType: ConjurationRelationshipType,
  nextType: ConjurationRelationshipType,
  nextNodeIds?: number[] | undefined,
  userId?: number,
) => {
  return prisma.conjurationRelationships.findMany({
    where: {
      previousNodeId,
      previousType,
      nextNodeId: nextNodeIds ? { in: nextNodeIds } : undefined,
      nextType,
      userId,
    },
  });
};
