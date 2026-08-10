// server/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { registerSchema } from '../schemas/auth.schema.js';
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
