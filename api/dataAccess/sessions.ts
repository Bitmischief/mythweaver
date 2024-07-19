import { indexCampaignContextQueue } from '../worker';
import { ContextType } from '@prisma/client';

export const indexSessionContext = async (
  campaignId: number,
  sessionId: number,
) => {
  await indexCampaignContextQueue.add({
    campaignId: campaignId,
    eventTargetId: sessionId,
    type: ContextType.SESSION,
  });
};
