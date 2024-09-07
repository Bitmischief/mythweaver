import { prisma } from '../lib/providers/prisma';

export const createCollection = async (data: {
  name: string;
  userId: number;
  campaignId: number;
}) => {
  return prisma.collections.create({
    data,
  });
};

export const updateCollectionForCampaign = async (
  campaignId: number,
  request: { name: string },
) => {
  return prisma.collections.updateMany({
    where: {
      campaignId: campaignId,
      parentCollectionId: null,
    },
    data: {
      name: request.name,
    },
  });
};
