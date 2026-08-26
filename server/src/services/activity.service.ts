// server/src/services/activity.service.ts
import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../lib/errors.js';

export interface LogActivityParams {
  issueId: string;
  actorId: string;
  verb: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
}

export async function logActivity(params: LogActivityParams) {
  const { issueId, actorId, verb, field, oldValue, newValue } = params;

  return prisma.issueActivity.create({
    data: {
      issueId,
      actorId,
      verb,
      field,
      oldValue,
      newValue,
    },
  });
}

export async function getIssueActivities(issueId: string) {
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, deletedAt: null },
  });

  if (!issue) {
    throw NotFoundError('Issue not found');
  }

  return prisma.issueActivity.findMany({
    where: { issueId },
    include: {
      actor: {
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
