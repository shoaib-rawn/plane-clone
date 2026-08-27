import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger.js';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { prisma } from './lib/prisma.js';
import { apiRouter } from './routes/index.js';

export const app = express();

// Security HTTP headers - Disable CSP so Swagger UI styles load successfully
app.use(helmet({ contentSecurityPolicy: false }));

// Cross-Origin Resource Sharing with credentials (allows both frontend and Swagger UI)
const allowedOrigins = [
  config.cors.origin,
  `http://localhost:${config.server.port}`,
  `http://127.0.0.1:${config.server.port}`
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
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

// Swagger Documentation Page (Interactive Playground)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes (v1)
app.use('/api/v1', apiRouter);

// Central error handler middleware (must be mounted as the LAST middleware)
app.use(errorHandler);

