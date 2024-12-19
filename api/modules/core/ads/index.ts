import { User } from '@prisma/client';
import { reportMetaAdConversionEvent } from '@/modules/core/ads/meta';
import { isProduction } from '@/modules/core/utils/environments';
import logger from '@/modules/core/logging/logger';

export enum AdConversionEvent {
  Lead = 'lead',
  Purchase = 'purchase',
}

export interface AdConversionDetails {
  purchase?: {
    currency: string;
    value: number;
  };
}

export const reportAdConversionEvent = async (
  event: AdConversionEvent,
  user: User,
  details?: AdConversionDetails,
) => {
  if (!isProduction) {
    logger.info(
      'Skipping ad conversion event reporting in non-production environment',
      { event, user, details },
    );
    return;
  }

  logger.info('Reporting ad conversion event', { event, user, details });
  await reportMetaAdConversionEvent(event, user, details);
};
