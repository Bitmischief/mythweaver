import dotenv from 'dotenv';
dotenv.config();

import express, {
  Application,
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import Router from './routes';
import {
  requestIdAsyncLocalStorage,
  useInjectRequestId,
} from './lib/requestIdMiddleware';
import { errorHandler } from './lib/errors/ErrorHandler';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import './worker/index';
import { ILogObj, Logger } from 'tslog';
import { useInjectTrackingInfo } from './lib/trackingMiddleware';
import { loggingInfoAsyncLocalStorage } from './lib/loggingMiddleware';

const logger = new Logger<ILogObj>();

const PORT = process.env.PORT || 8000;

const app: Application = express();

const whitelist = JSON.parse(process.env.CORS_ALLOWED_ORIGINS || '[]');
const corsOptions = {
  origin: whitelist,
};
app.use(cors(corsOptions));

app.use(express.json());

morgan.token('requestId', () => {
  return requestIdAsyncLocalStorage.getStore()?.requestId;
});

morgan.token('userEmail', () => {
  return loggingInfoAsyncLocalStorage.getStore()?.userEmail;
});

morgan.token('userId', () => {
  return loggingInfoAsyncLocalStorage.getStore()?.userId?.toString() || '';
});

app.use(
  morgan(
    '{ "method": ":method", "url": ":url", "status": ":status", "contentLength": ":res[content-length]", "responseTime": ":response-time", "requestId": ":requestId", "userEmail": ":userEmail", "userId": ":userId" }',
  ),
);
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
app.use(useInjectRequestId);
app.use(useInjectTrackingInfo);

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

const errorHandlerMiddleware: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  logger.info('Error handler middleware', err?.message);
  errorHandler.handleError(err, res);
};

app.use(errorHandlerMiddleware);

app.listen(PORT, async () => {
  logger.info('Server is running on port', PORT);
});

process.on('unhandledRejection', (reason: Error | any) => {
  logger.info(`Unhandled Rejection: ${reason.message || reason}`);

  throw new Error(reason.message || reason);
});

process.on('uncaughtException', (error: Error) => {
  console.log(`Uncaught Exception: ${error.message}`);

  errorHandler.handleError(error);
});
