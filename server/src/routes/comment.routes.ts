// server/src/routes/comment.routes.ts
import { Router } from 'express';
import {
  getIssueCommentsController,
  addCommentController,
  updateCommentController,
  deleteCommentController,
} from '../controllers/comment.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const commentRouter = Router({ mergeParams: true });

commentRouter.get('/', requireAuth, getIssueCommentsController);
commentRouter.post('/', requireAuth, addCommentController);
commentRouter.patch('/:commentId', requireAuth, updateCommentController);
commentRouter.delete('/:commentId', requireAuth, deleteCommentController);
