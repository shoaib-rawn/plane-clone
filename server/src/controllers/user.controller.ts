// server/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { updateUserSchema } from '../schemas/user.schema.js';
import * as userService from '../services/user.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { prisma } from '../lib/prisma.js';
export const updateMeController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const validatedBody = updateUserSchema.parse(req.body);

  const user = await userService.updateCurrentUser(userId, validatedBody);

  return res.status(200).json({
    data: { user },
  });
});
export const getAllUsersController = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  return res.json({ data: users });
});
