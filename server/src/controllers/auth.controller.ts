// server/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as
    | 'none'
    | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export const registerController = asyncHandler(
  async (req: Request, res: Response) => {
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        message: 'Only Admin is allowed to create user',
      });
    }

    const validatedBody = registerSchema.parse(req.body);
    const result = await authService.registerUser(validatedBody);

    res.cookie('token', result.token, COOKIE_OPTIONS);

    return res.status(201).json({
      data: result,
    });
  },
);

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedBody = loginSchema.parse(req.body);
    const result = await authService.loginUser(validatedBody);

    res.cookie('token', result.token, COOKIE_OPTIONS);

    return res.status(200).json({
      data: result,
    });
  },
);

export const logoutController = asyncHandler(
  async (_req: Request, res: Response) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as
        | 'none'
        | 'lax',
      path: '/',
    });

    return res.status(200).json({
      data: {
        message: 'Logged out successfully',
      },
    });
  },
);

export const getMeController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const user = await userService.getCurrentUser(userId);
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId },
      select: { role: true },
    });

    return res.status(200).json({
      data: {
        user,
        workspaceRole: workspaceMember?.role || 'MEMBER',
      },
    });
  },
);

import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema.js';

export const forgotPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedBody = forgotPasswordSchema.parse(req.body);
    const clientOrigin = req.get('origin') || req.get('referer');
    const result = await authService.requestPasswordReset(
      validatedBody.email,
      clientOrigin,
    );

    return res.status(200).json({
      data: result,
    });
  },
);

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedBody = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(
      validatedBody.token,
      validatedBody.password,
    );

    return res.status(200).json({
      data: result,
    });
  },
);
