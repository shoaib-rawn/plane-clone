// server/src/app.ts
import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';

export const app = express();

app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

app.use(express.json());

// Public health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
