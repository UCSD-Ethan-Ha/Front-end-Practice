import cors from 'cors';
import express from 'express';
import { CORS_ORIGIN, IS_PRODUCTION } from './config.js';
import { errorHandler, notFound } from './errors.js';
import { devAffordances } from './middleware/devAffordances.js';
import { requireJson } from './middleware/requireJson.js';
import { healthRouter } from './routes/health.js';

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  // Flat string / string[] values only; no nested objects from ?a[b]=c.
  app.set('query parser', 'simple');

  app.use(cors({ origin: CORS_ORIGIN, credentials: true, exposedHeaders: ['Location'] }));
  if (!IS_PRODUCTION) app.use(devAffordances);
  app.use(requireJson);
  app.use(express.json());

  app.use('/api', healthRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
