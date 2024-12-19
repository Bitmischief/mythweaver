import {
  AdConversionDetails,
  AdConversionEvent,
} from '@/modules/core/ads/index';
import axios from 'axios';
import { AppError } from '@/modules/core/errors/AppError';
import { sha256 } from 'js-sha256';
import { User } from '@prisma/client';
import logger from '@/modules/core/logging/logger';

const API_VERSION = 'v19.0';

export const reportMetaAdConversionEvent = async (
  event: AdConversionEvent,
  user: User,
  details?: AdConversionDetails,
) => {
  const pixelId = process.env.FACEBOOK_CONVERSIONS_PIXEL_ID;

  if (!pixelId) {
    throw new AppError({
      description: 'Missing Facebook conversions pixel ID.',
      httpCode: 500,
    });
  }

  const accessToken = process.env.FACEBOOK_CONVERSIONS_ACCESS_TOKEN;

  if (!accessToken) {
    throw new AppError({
      description: 'Missing Facebook conversions access token.',
      httpCode: 500,
    });
  }

  const payload = {
    data: [
      {
        event_name:
          event === AdConversionEvent.Purchase
            ? 'Purchase'
            : event === AdConversionEvent.Lead
              ? 'Lead'
              : 'ERROR',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: {
          em: [sha256(user.email)],
          external_id: [sha256(user.id.toString())],
        },
        custom_data: details
          ? {
              currency: details.purchase?.currency,
              value: details.purchase?.value,
            }
          : undefined,
      },
    ],
  };
  logger.info('Reporting Meta ad conversion event', {
    event,
    user,
    details,
    payload,
  });

  const response = await axios.post(
    `https://graph.facebook.com/${API_VERSION}/${pixelId}/events?access_token=${accessToken}`,
    payload,
  );

  if (response.status !== 200) {
    throw new AppError({
      description: 'Failed to report ad conversion event to Meta.',
      httpCode: 500,
    });
  }

  logger.info('Reported ad conversion event to Meta');
};
