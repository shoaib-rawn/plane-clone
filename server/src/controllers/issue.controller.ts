import { Request, Response } from 'express';
import {
  createIssue,
  getProjectIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  getMyIssues,
} from '../services/issue.service.js';
import {
  createIssueSchema,
  updateIssueSchema,
  filterIssuesQuerySchema,
} from '../schemas/issue.schema.js';
import { getEffectiveRole } from '../lib/permissions.js';
import { NotFoundError, ForbiddenError } from '../lib/errors.js';
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

export const getProjectIssuesController = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const validatedQuery = filterIssuesQuerySchema.parse(req.query);

  const issues = await getProjectIssues(projectId, validatedQuery);

  return res.status(200).json({
    data: issues,
  });
});

export const getIssueByIdController = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const userId = req.user!.id;

  const issue = await getIssueById(issueId);

  // Authorization check (Chapter 5.4)
  const role = await getEffectiveRole(userId, issue.projectId);
  if (!role) {
    throw NotFoundError('Issue not found');
  }

  return res.status(200).json({
    data: issue,
  });
});

export const updateIssueController = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const userId = req.user!.id;

  // 1. Fetch issue to know its projectId
  const existingIssue = await getIssueById(issueId);

  // 2. Check project permissions: only ADMIN or MEMBER can edit
  const role = await getEffectiveRole(userId, existingIssue.projectId);
  if (!role) {
    throw NotFoundError('Issue not found');
  }
  if (role === 'VIEWER') {
    throw ForbiddenError('Viewers are not allowed to modify issues in this project');
  }

  // 3. Validate body
  const validatedBody = updateIssueSchema.parse(req.body);

  // 4. Update
  const updatedIssue = await updateIssue(issueId, validatedBody);

  return res.status(200).json({
    data: updatedIssue,
  });
});

export const deleteIssueController = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const userId = req.user!.id;

  // 1. Fetch issue to know its projectId
  const existingIssue = await getIssueById(issueId);

  // 2. Check project permissions: only ADMIN or MEMBER can delete
  const role = await getEffectiveRole(userId, existingIssue.projectId);
  if (!role) {
    throw NotFoundError('Issue not found');
  }
  if (role === 'VIEWER') {
    throw ForbiddenError('Viewers are not allowed to delete issues in this project');
  }

  // 3. Delete
  await deleteIssue(issueId);

  return res.status(200).json({
    data: {
      message: 'Issue deleted successfully',
    },
  });
});

export const getMyIssuesController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const issues = await getMyIssues(userId);

  return res.status(200).json({
    data: issues,
  });
});

