import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import {
  isLocalDevelopment,
  isProduction,
} from '@/modules/core/utils/environments';
import { Application } from 'express';

export const initSentry = () => {
  try {
    console.log('Initializing sentry');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [nodeProfilingIntegration],
      environment: isProduction
        ? 'production'
        : isLocalDevelopment
          ? 'local'
          : 'development',
      release: process.env.VERSION,
      tracesSampleRate: isProduction ? 0.05 : 1.0,
      profilesSampleRate: isProduction ? 0.05 : 1.0,
      beforeSend(event) {
        if (isLocalDevelopment) {
          return null;
        }

        if (
          event.request?.url &&
          event.request?.url?.indexOf('/version') > -1
        ) {
          return null;
        }

        return event;
      },
    });
    console.log('Sentry initialized');
  } catch (err) {
    console.error('Error initializing Sentry', err);
  }
};

export const setupSentryErrorHandler = (app: Application) => {
  console.log('Initializing sentry error handler');
  Sentry.setupExpressErrorHandler(app);
};
