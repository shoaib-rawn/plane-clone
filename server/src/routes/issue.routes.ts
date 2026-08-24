// server/src/routes/issue.routes.ts
import { Router } from 'express';
import { createIssueController, getProjectIssuesController } from '../controllers/issue.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';
import { ProjectRole } from '@prisma/client';

export const issueRouter = Router({ mergeParams: true });

// List issues - any project viewer, member, or admin can list tickets
issueRouter.get(
  '/',
  requireAuth,
  requireProjectRole(ProjectRole.VIEWER),
  getProjectIssuesController
);

// Create issue - only project members (MEMBER or ADMIN) can create tickets
issueRouter.post(
  '/',
  requireAuth,
  requireProjectRole(ProjectRole.MEMBER),
  createIssueController
);
