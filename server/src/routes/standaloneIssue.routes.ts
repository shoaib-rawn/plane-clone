// server/src/routes/standaloneIssue.routes.ts
import { Router } from 'express';
import {
  getIssueByIdController,
  updateIssueController,
  deleteIssueController,
} from '../controllers/issue.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { commentRouter } from './comment.routes.js';
import { activityRouter } from './activity.routes.js';

export const standaloneIssueRouter = Router();

standaloneIssueRouter.use('/:issueId/comments', commentRouter);
standaloneIssueRouter.use('/:issueId/activities', activityRouter);

standaloneIssueRouter.get('/:issueId', requireAuth, getIssueByIdController);
standaloneIssueRouter.patch('/:issueId', requireAuth, updateIssueController);
standaloneIssueRouter.delete('/:issueId', requireAuth, deleteIssueController);
