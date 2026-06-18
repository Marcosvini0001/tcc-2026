import express from 'express';
import cors from 'cors';
import path from 'node:path';

import userRoutes from './routes/userRoutes';
import admRoutes from './routes/admRoutes';
import { requestIdMiddleware } from './middleware/requestIdMiddleware';
import { metricsMiddleware, metricsEndpoint } from './middleware/metricsMiddleware';
import { RateLimiters } from './middleware/rateLimitMiddleware';
import logger from './utils/logger';
import './models/userModels';
import './models/admModels';
import './models/userFriendModels';
import './models/taskModels';

const app = express();

const generalRateLimit = RateLimiters.general();
const authRateLimit = RateLimiters.auth();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestIdMiddleware);
app.use(metricsMiddleware);
app.use(generalRateLimit.middleware());

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/metrics', metricsEndpoint);

app.use('/auth', authRateLimit.middleware());

app.use('/users', userRoutes);
app.use('/adms', admRoutes);

app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {

  if (error instanceof Error) {
    logger.error('Unhandled application error', { requestId: req.requestId, error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Internal server error' });
  }

  return next();
});

export default app;