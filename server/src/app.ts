// server/src/app.ts
import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { prisma } from './lib/prisma.js';
import { apiRouter } from './routes/index.js';

import { apiRouter } from './routes/index.js';

export const app = express();

app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

app.use(express.json());

// Public health check endpoint (verifies database connection per Day 5 spec)
app.get('/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (err) {
    next(err);
  }
});

// API Routes (v1)
app.use('/api/v1', apiRouter);

// Central error handler middleware (must be mounted as the LAST middleware)
app.use(errorHandler);

