// server/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const registerController = asyncHandler(async (req: Request, res: Response) => {
  const validatedBody = registerSchema.parse(req.body);
  const result = await authService.registerUser(validatedBody);

  return res.status(201).json({
    data: result,
  });
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const validatedBody = loginSchema.parse(req.body);
  const result = await authService.loginUser(validatedBody);

  return res.status(200).json({
    data: result,
  });
});

export const getMeController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await userService.getCurrentUser(userId);

  return res.status(200).json({
    data: { user },
  });
});
