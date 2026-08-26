// server/src/lib/auth.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Hashes a plain text password using bcrypt with configured salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.bcrypt.rounds);
}

/**
 * Compares a plain text password with a hashed password in a timing-safe manner.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a signed JWT bearer token for a given user ID.
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Generates a signed JWT token specifically for password resets (expires in 1h).
 */
export function generateResetToken(userId: string): string {
  return jwt.sign({ userId, type: 'reset_password' }, config.jwt.secret, {
    expiresIn: '1h',
  });
}

/**
 * Verifies a password reset token and extracts the userId.
 */
export function verifyResetToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; type?: string };
  if (decoded.type !== 'reset_password') {
    throw new Error('Invalid reset token type');
  }
  return { userId: decoded.userId };
}

