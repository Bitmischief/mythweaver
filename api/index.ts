import dotenv from 'dotenv';
dotenv.config();

import express, {
  Application,
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from 'express';
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
import { isLocalDevelopment, isProduction } from './lib/utils';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { endTrialQueue, lifetimeSubscriptionCreditQueue } from './worker';
import { AppError } from './lib/errors/AppError';

const PORT = process.env.PORT || 8000;

const app: Application = express();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
    nodeProfilingIntegration(),
  ],
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

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(cors());
app.options('*', cors());

app.use(
  express.json({
    verify(req: http.IncomingMessage, res: http.ServerResponse, buf: Buffer) {
      (req as any).rawBody = buf;
    },
    limit: '5mb',
  }),
);

if (!isLocalDevelopment) {
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

app.use(express.static('public'));

// Create the rate limit rule
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

app.use(Router);

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: '/swagger.json',
    },
  }),
);

// The error handler must be registered before any other error middleware and after all controllers
app.use(
  Sentry.Handlers.errorHandler({
    shouldHandleError(error: any) {
      if (error instanceof AppError) {
        return false;
      }
      return true;
    },
  }),
);

const errorHandlerMiddleware: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  const logger = useLogger(res);
  logger.error(`Error handler middleware: ${err?.message}`);
  errorHandler.handleError(err, res);
};

app.use(errorHandlerMiddleware);

app.listen(PORT, async () => {
  logger.info(`Server is running on port ${PORT}`);

  await endTrialQueue.add({}, { repeat: { cron: '* * * * *' } });
  logger.info('End trial job scheduled');

  await lifetimeSubscriptionCreditQueue.add(
    {},
    { repeat: { cron: '0 * 1 * *' } },
  );
  logger.info('Lifetime subscription credits job scheduled');
});

process.on('unhandledRejection', (reason: Error | any) => {
  logger.error(`Unhandled Rejection: ${reason.message || reason}`);

  throw new Error(reason.message || reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`);

  errorHandler.handleError(error);
});
