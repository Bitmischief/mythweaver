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
import { isLocalDevelopment } from './lib/utils';

const PORT = process.env.PORT || 8000;

const app: Application = express();

app.use(cors());
app.options('*', cors());

app.use(
  express.json({
    verify(req: http.IncomingMessage, res: http.ServerResponse, buf: Buffer) {
      (req as any).rawBody = buf;
    },
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

const errorHandlerMiddleware: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  const logger = useLogger(res);
  logger.info('Error handler middleware', err?.message);
  errorHandler.handleError(err, res);
};

app.use(errorHandlerMiddleware);

app.listen(PORT, async () => {
  logger.info(`Server is running on port ${PORT}`);
});

process.on('unhandledRejection', (reason: Error | any) => {
  logger.info(`Unhandled Rejection: ${reason.message || reason}`);

  throw new Error(reason.message || reason);
});

process.on('uncaughtException', (error: Error) => {
  console.log(`Uncaught Exception: ${error.message}`);

  errorHandler.handleError(error);
});
