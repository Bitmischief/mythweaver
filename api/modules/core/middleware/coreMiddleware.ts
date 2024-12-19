import { Application } from 'express';
import cors from 'cors';
import express from 'express';
import * as http from 'http';
import rateLimit from 'express-rate-limit';

export const initCoreMiddleware = (app: Application) => {
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

  app.set('trust proxy', 1);
};
