import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import Router from './routes';
import { errorHandler } from './lib/errors/ErrorHandler';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import './worker/index';
import * as http from 'http';
import logger from './lib/logger';
import { getRequestId, useLogger } from './lib/loggingMiddleware';
import pinoHTTP from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import { isLocalDevelopment, isProduction } from './lib/environments';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import {
  dailyCampaignContextQueue,
  endTrialQueue,
  retranscribeSessionsQueue,
} from './worker';

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

  console.log('Initializing swagger');
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        url: '/swagger.json',
      },
    }),
  );

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

    // End trial job
    const existingEndTrialJob = await endTrialQueue.getRepeatableJobs();
    if (!existingEndTrialJob.some((job) => job.id === 'end-trial-job')) {
      await endTrialQueue.add(
        {},
        {
          repeat: { cron: '* * * * *' },
          jobId: 'end-trial-job',
        },
      );
      console.log('End trial job scheduled');
    } else {
      console.log('End trial job already scheduled');
    }

    // Daily campaign context job
    const existingDailyCampaignJob =
      await dailyCampaignContextQueue.getRepeatableJobs();
    if (
      !existingDailyCampaignJob.some(
        (job) => job.id === 'daily-campaign-context-job',
      )
    ) {
      await dailyCampaignContextQueue.add(
        {},
        {
          repeat: { cron: '0 7 * * *' },
          jobId: 'daily-campaign-context-job',
        },
      );
      console.log('Daily campaign context sync job scheduled');
    } else {
      console.log('Daily campaign context sync job already scheduled');
    }

    // Retranscribe job
    const retranscribeJobId = 'retranscribe-v2';
    const existingRetranscribeJob =
      await retranscribeSessionsQueue.getJob(retranscribeJobId);
    if (!existingRetranscribeJob) {
      await retranscribeSessionsQueue.add(
        {},
        {
          jobId: retranscribeJobId,
        },
      );
      console.log('Retranscribe job scheduled');
    } else {
      console.log('Retranscribe job already scheduled');
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
