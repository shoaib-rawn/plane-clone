// server/src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { UnauthorizedError } from '../lib/errors.js';

interface TokenPayload {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    // 1. Extract token from httpOnly cookie first, then fallback to Authorization header
    let token: string | undefined = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw UnauthorizedError('Authentication token required', 'UNAUTHORIZED');
    }

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch {
      throw UnauthorizedError('Invalid or expired authentication token', 'UNAUTHORIZED');
    }

    if (!payload.userId) {
      throw UnauthorizedError('Invalid authentication token payload', 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw UnauthorizedError('User account is invalid or inactive', 'UNAUTHORIZED');
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (err) {
    next(err);
  }
}
