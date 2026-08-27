// server/src/controllers/activity.controller.ts
import { Request, Response } from 'express';
import { getIssueActivities } from '../services/activity.service.js';
import { getIssueById } from '../services/issue.service.js';
import { getEffectiveRole } from '../lib/permissions.js';
import { NotFoundError } from '../lib/errors.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const getIssueActivitiesController = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const userId = req.user!.id;

  const issue = await getIssueById(issueId);
  const role = await getEffectiveRole(userId, issue.projectId);
  if (!role) {
    throw NotFoundError('Issue not found');
  }

  const activities = await getIssueActivities(issueId);

  return res.status(200).json({
    data: activities,
  });
});
