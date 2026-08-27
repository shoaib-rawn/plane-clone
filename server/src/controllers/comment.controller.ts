// server/src/controllers/comment.controller.ts
import { Request, Response } from 'express';
import {
  getIssueComments,
  addComment,
  updateComment,
  deleteComment,
} from '../services/comment.service.js';
import { getIssueById } from '../services/issue.service.js';
import { createCommentSchema, updateCommentSchema } from '../schemas/comment.schema.js';
import { getEffectiveRole } from '../lib/permissions.js';
import { NotFoundError, ForbiddenError } from '../lib/errors.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const getIssueCommentsController = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const userId = req.user!.id;

  const issue = await getIssueById(issueId);
  const role = await getEffectiveRole(userId, issue.projectId);
  if (!role) {
    throw NotFoundError('Issue not found');
  }

  const comments = await getIssueComments(issueId);

  return res.status(200).json({
    data: comments,
  });
});

export const addCommentController = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const userId = req.user!.id;

  const issue = await getIssueById(issueId);
  const role = await getEffectiveRole(userId, issue.projectId);
  if (!role) {
    throw NotFoundError('Issue not found');
  }
  if (role === 'VIEWER') {
    throw ForbiddenError('Viewers cannot post comments in this project');
  }

  const validatedBody = createCommentSchema.parse(req.body);
  const comment = await addComment(issueId, userId, validatedBody.body);

  return res.status(201).json({
    data: comment,
  });
});

export const updateCommentController = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;

  const validatedBody = updateCommentSchema.parse(req.body);
  const updatedComment = await updateComment(commentId, userId, validatedBody.body);

  return res.status(200).json({
    data: updatedComment,
  });
});

export const deleteCommentController = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;

  await deleteComment(commentId, userId);

  return res.status(200).json({
    data: {
      message: 'Comment deleted successfully',
    },
  });
});
