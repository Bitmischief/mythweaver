import { Campaign } from '@prisma/client';
import { prisma } from '../../lib/providers/prisma';
import logger from '../../lib/logger';

export const processCampaignContextSync = async () => {
  const chunkSize = 5;
  let skip = 0;
  let campaigns: Campaign[] = [];

  do {
    console.log('Fetching batch of campaigns', skip, chunkSize);
    campaigns = await prisma.campaign.findMany({
      orderBy: {
        id: 'asc',
      },
      skip,
      take: chunkSize,
    });

    // for (const campaign of campaigns) {
    //
    // }

    logger.info(
      `Processed batch of campaigns with ids: ${campaigns.map((c) => c.id).join(', ')}`,
    );
    skip += chunkSize;
    console.log('Skip set to', skip, 'campaigns.length', campaigns.length);
  } while (campaigns.length > 0);
};
