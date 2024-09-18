import Queue from 'bull';
import { Campaign, Conjuration, ContextType, Session } from '@prisma/client';
import { prisma } from '../../lib/providers/prisma';
import { indexCampaignContext } from './indexCampaignContext';
import { processInChunks } from '../../lib/utils';
import logger from '../../lib/logger';
import { config } from '../config';

export const dailyCampaignContextQueue = new Queue(
  'campaign-context-sync',
  config,
);

dailyCampaignContextQueue.process(async (job, done) => {
  logger.info('Processing daily campaign context sync queue job');

  try {
    await processDailyCampaignContextSync();
    logger.info(
      'Completed processing daily campaign context sync queue job',
      job.data,
    );
    done();
  } catch (err) {
    logger.error(
      'Error processing daily campaign context sync queue job!',
      err,
    );
    done(new Error('Error processing daily campaign context sync queue job!'));
  }
});

export const processDailyCampaignContextSync = async () => {
  await processInChunks<Campaign>(
    5,
    (skip, take) =>
      prisma.campaign.findMany({
        orderBy: { id: 'asc' },
        skip,
        take,
      }),
    async (campaign) => {
      logger.info(`Indexing campaign ${campaign.id}`);
      await indexCampaignContext({
        type: ContextType.CAMPAIGN,
        campaignId: campaign.id,
        eventTargetId: campaign.id,
      });

      await processInChunks<Session>(
        5,
        (skip, take) =>
          prisma.session.findMany({
            where: {
              campaignId: campaign.id,
            },
            orderBy: { id: 'asc' },
            skip,
            take,
          }),
        async (session) => {
          logger.info(
            `Indexing session ${session.id} for campaign ${campaign.id}`,
          );
          await indexCampaignContext({
            type: ContextType.SESSION,
            campaignId: campaign.id,
            eventTargetId: session.id,
          });
        },
      );

      await processInChunks<Conjuration>(
        5,
        (skip, take) =>
          prisma.conjuration.findMany({
            where: {
              campaignConjuration: {
                some: {
                  campaignId: campaign.id,
                },
              },
            },
            orderBy: { id: 'asc' },
            skip,
            take,
          }),
        async (conjuration) => {
          logger.info(
            `Indexing conjuration ${conjuration.id} for campaign ${campaign.id}`,
          );
          await indexCampaignContext({
            type: ContextType.CONJURATION,
            campaignId: campaign.id,
            eventTargetId: conjuration.id,
          });
        },
      );
    },
  );
};
