// server/src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  CORS_ORIGIN: z.string().url(),
  BCRYPT_ROUNDS: z.coerce.number().min(4).default(10),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1); // fail loudly at boot, not quietly at 3am
}

const raw = parsed.data;

export const config = {
  env: raw.NODE_ENV,
  server: {
    port: raw.PORT,
  },
  database: {
    url: raw.DATABASE_URL,
  },
  jwt: {
    secret: raw.JWT_SECRET,
    expiresIn: raw.JWT_EXPIRES_IN,
  },
  cors: {
    origin: raw.CORS_ORIGIN,
  },
  bcrypt: {
    rounds: raw.BCRYPT_ROUNDS,
  },
};

export const env = raw;
