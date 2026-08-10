// server/src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { updateUserSchema } from '../schemas/user.schema.js';
import * as userService from '../services/user.service.js';

export async function updateMeController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const validatedBody = updateUserSchema.parse(req.body);

    const user = await userService.updateCurrentUser(userId, validatedBody);

    return res.status(200).json({
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}
