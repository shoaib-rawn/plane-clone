// server/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validatedBody = registerSchema.parse(req.body);
    const result = await authService.registerUser(validatedBody);

    return res.status(201).json({
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validatedBody = loginSchema.parse(req.body);
    const result = await authService.loginUser(validatedBody);

    return res.status(200).json({
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
