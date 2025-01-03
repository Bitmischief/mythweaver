import dotenv from 'dotenv';
import Router from '@/routes';
import { errorHandler } from '@/lib/errors/ErrorHandler';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import '@/worker/index';
import * as http from 'http';
import logger from '@/lib/logger';
import { getRequestId, useLogger } from '@/lib/loggingMiddleware';
import pinoHTTP from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import { isLocalDevelopment, isProduction } from '@/lib/environments';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import {
  subscriptionPlanUpdateQueue,
  expiredSubscriptionCheckQueue,
} from '@/worker';

console.log('Initializing env vars');
dotenv.config();

const PORT = process.env.PORT || 8000;

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
    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
    beforeSend(event) {
      if (isLocalDevelopment) {
        return null;
      }

      if (event.request?.url && event.request?.url?.indexOf('/version') > -1) {
        return null;
      }

      return event;
    },
  });
  console.log('Sentry initialized');
} catch (err) {
  console.error('Error initializing Sentry', err);
}

// these imports have to live below sentry init for it to work properly for some reason
import express, {
  Application,
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from 'express';
import { initWorkers } from './modules/core/workers/workers';

try {
  console.log('Initializing express');
  const app: Application = express();

  console.log('Initializing cors');
  app.use(cors());
  app.options('*', cors());

  console.log('Initializing json body parser');
  app.use(
    express.json({
      verify(req: http.IncomingMessage, res: http.ServerResponse, buf: Buffer) {
        (req as any).rawBody = buf;
      },
      limit: '5mb',
    }),
  );

  if (!isLocalDevelopment) {
    console.log('Initializing pino');
    app.use(
      pinoHTTP({
        logger: logger.internalLogger,
        genReqId: function (req, res) {
          const existingID = req.id ?? req.headers['x-request-id'];
          if (existingID) return existingID;
          const id = uuidv4();
          res.setHeader('X-Request-Id', id);
          return id;
        },
        autoLogging: {
          ignore: (req) => req.url === '/version',
        },
        customProps: function (req, res) {
          return {
            requestId: getRequestId(req, res),
          };
        },
      }),
    );
  }

  console.log('Initializing static file middleware');
  app.use(express.static('public'));

  // Create the rate limit rule
  console.log('Initializing api request limiter');
  const apiRequestLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 120, // limit each IP to 120 requests per windowMs
    handler: function (req, res /*next*/) {
      return res.status(429).json({
        error: 'You sent too many requests. Please wait a while then try again',
      });
    },
  });

  app.use(apiRequestLimiter);
  app.set('trust proxy', 1); // trust first proxy

  console.log('Initializing routes');
  app.use(Router);

  console.log('Initializing sentry error handler');
  Sentry.setupExpressErrorHandler(app);

  const errorHandlerMiddleware: ErrorRequestHandler = (
    err: any,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction,
  ) => {
    const localLogger = useLogger();
    localLogger.error(
      `Error handler middleware: ${err?.message}`,
      { req, res },
      err,
    );
    errorHandler.handleError(err, res);
  };

  app.use(errorHandlerMiddleware);

  app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    initWorkers();

    // Expired subscription check job
    const expiredSubscriptionCheckJobId = 'expired-subscription-check-job';
    const existingExpiredSubscriptionCheckJob =
      await expiredSubscriptionCheckQueue.getRepeatableJobs();
    if (
      !existingExpiredSubscriptionCheckJob.some(
        (job) => job.id === expiredSubscriptionCheckJobId,
      )
    ) {
      await expiredSubscriptionCheckQueue.add(
        {},
        {
          repeat: { cron: '0 6 * * *' },
          jobId: expiredSubscriptionCheckJobId,
        },
      );
      console.log('Daily expired subscription check job scheduled');
    } else {
      console.log('Daily expired subscription check job already scheduled');
    }

    // Subscription Plan Change job
    const subscriptionPlanUpdateJobId = 'subscription-plan-update-job';
    const existingSubscriptionPlanUpdateJob =
      await subscriptionPlanUpdateQueue.getRepeatableJobs();
    if (
      !existingSubscriptionPlanUpdateJob.some(
        (job) => job.id === subscriptionPlanUpdateJobId,
      )
    ) {
      await subscriptionPlanUpdateQueue.add(
        {},
        {
          repeat: { cron: '0 * * * *' }, // Run every hour at the start of the hour
          jobId: subscriptionPlanUpdateJobId,
        },
      );
      console.log('Hourly subscription plan update job scheduled');
    } else {
      console.log('Hourly subscription plan update job already scheduled');
    }
  });

  process.on('unhandledRejection', (reason: Error | any) => {
    console.error(`Unhandled Rejection: ${reason.message || reason}`);

    throw new Error(reason.message || reason);
  });

  process.on('uncaughtException', (error: Error) => {
    console.error(`Uncaught Exception: ${error.message}`);

    errorHandler.handleError(error);
  });
} catch (err) {
  console.error('Error initializing app', err);
}
