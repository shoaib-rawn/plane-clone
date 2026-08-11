// server/src/controllers/project.controller.ts
import { Request, Response } from 'express';
import { createProjectSchema } from '../schemas/project.schema.js';
import { createProject } from '../services/project.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const createProjectController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const validatedBody = createProjectSchema.parse(req.body);

  const result = await createProject(userId, validatedBody);

  return res.status(201).json({
    data: result,
  });
});
