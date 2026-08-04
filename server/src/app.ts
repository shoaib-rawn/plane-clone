// server/src/app.ts
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';

export const app = express();

// Middlewares
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

// Public health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
