import dotenv from 'dotenv';
dotenv.config();

import Router from '@/routes';
import { initWorkers } from './modules/core/workers/workers';
import {
  initSentry,
  setupSentryErrorHandler,
} from '@/modules/core/middleware/sentry';
import { initCoreMiddleware } from '@/modules/core/middleware/coreMiddleware';
import { initLoggingMiddleware } from '@/modules/core/logging/loggingMiddleware';
import { initErrorHandlerMiddleware } from '@/modules/core/middleware/errorMiddleware';

const PORT = process.env.PORT || 8000;
initSentry();

// these imports have to live below sentry init for it to work properly for some reason
import express, { Application } from 'express';

try {
  const app: Application = express();

  initCoreMiddleware(app);
  initLoggingMiddleware(app);

  app.use(Router);

  setupSentryErrorHandler(app);
  initErrorHandlerMiddleware(app);

  app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await initWorkers();
  });
} catch (err) {
  console.error('Error initializing app', err);
}
