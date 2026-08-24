// server/src/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { createIssue } from '../services/issue.service.js';
import { createIssueSchema } from '../schemas/issue.schema.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const createIssueController = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const createdById = req.user!.id;

  // Validate the body
  const validatedBody = createIssueSchema.parse(req.body);

  // Call the service
  const issue = await createIssue({
    projectId,
    createdById,
    ...validatedBody,
  });

  return res.status(201).json({
    data: issue,
  });
});
