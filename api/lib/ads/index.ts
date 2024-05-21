import { User } from '@prisma/client';
import { reportMetaAdConversionEvent } from './meta';
import logger from '../logger';
import { isProduction } from '../utils';

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
