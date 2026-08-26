
// ------------------------------------------------------------
// Ye controller HTTP request ko handle karta hai jab client `/api/v1/projects` par POST karta hai.
// Steps:
//   1. `requireAuth` middleware se user ki identity (req.user.id) milti hai – security ke liye.
//   2. `createProjectSchema` se request body ko validate karta hai (Never trust the client).
//   3. Service layer (`createProject`) ko call karta hai – business logic wahan hota hai.
//   4. Result ko `{ data: ... }` shape me 201 status ke saath client ko bhejta hai – API contract (Chapter 11).
// AsyncHandler se errors automatically next middleware (global error handler) ko forward hote hain.
// ------------------------------------------------------------
import { Request, Response } from 'express';
import { createProjectSchema, updateProjectSchema } from '../schemas/project.schema.js';
import {
  createProject,
  getProjectsForUser,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
} from '../services/project.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const createProjectController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const validatedBody = createProjectSchema.parse(req.body);

  const result = await createProject(userId, validatedBody);

  return res.status(201).json({
    data: result,
  });
});

export const getProjectsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await getProjectsForUser(userId);

  return res.status(200).json({
    data: result,
  });
});

export const updateProjectController = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const validatedBody = updateProjectSchema.parse(req.body);

  const result = await updateProject(projectId, validatedBody);

  return res.status(200).json({
    data: result,
  });
});

export const archiveProjectController = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await archiveProject(projectId);

  return res.status(200).json({
    data: result,
  });
});

export const unarchiveProjectController = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await unarchiveProject(projectId);

  return res.status(200).json({
    data: result,
  });
});

export const deleteProjectController = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await deleteProject(projectId);

  return res.status(200).json({
    data: result,
  });
});


