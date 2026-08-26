// server/src/services/comment.service.ts
import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError } from '../lib/errors.js';
import { getEffectiveRole } from '../lib/permissions.js';
import { logActivity } from './activity.service.js';

export async function getIssueComments(issueId: string) {
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, deletedAt: null },
  });

  if (!issue) {
    throw NotFoundError('Issue not found');
  }

  return prisma.issueComment.findMany({
    where: {
      issueId,
      deletedAt: null,
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

export async function addComment(issueId: string, authorId: string, body: string) {
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, deletedAt: null },
  });

  if (!issue) {
    throw NotFoundError('Issue not found');
  }

  const comment = await prisma.issueComment.create({
    data: {
      issueId,
      authorId,
      body,
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Log activity
  await logActivity({
    issueId,
    actorId: authorId,
    verb: 'commented',
  });

  return comment;
}

export async function updateComment(commentId: string, userId: string, body: string) {
  const comment = await prisma.issueComment.findFirst({
    where: { id: commentId, deletedAt: null },
    include: {
      issue: {
        select: { projectId: true },
      },
    },
  });

  if (!comment) {
    throw NotFoundError('Comment not found');
  }

  // Check authorization: only the author or a project admin can update the comment
  const role = await getEffectiveRole(userId, comment.issue.projectId);
  const isAuthor = comment.authorId === userId;
  const isAdmin = role === 'ADMIN';

  if (!isAuthor && !isAdmin) {
    throw ForbiddenError('You do not have permission to edit this comment');
  }

  return prisma.issueComment.update({
    where: { id: commentId },
    data: {
      body,
      editedAt: new Date(),
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.issueComment.findFirst({
    where: { id: commentId, deletedAt: null },
    include: {
      issue: {
        select: { projectId: true },
      },
    },
  });

  if (!comment) {
    throw NotFoundError('Comment not found');
  }

  // Check authorization: author or project admin
  const role = await getEffectiveRole(userId, comment.issue.projectId);
  const isAuthor = comment.authorId === userId;
  const isAdmin = role === 'ADMIN';

  if (!isAuthor && !isAdmin) {
    throw ForbiddenError('You do not have permission to delete this comment');
  }

  await prisma.issueComment.update({
    where: { id: commentId },
    data: {
      deletedAt: new Date(),
    },
  });

  return { success: true };
}
