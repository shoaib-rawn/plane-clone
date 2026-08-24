// server/src/services/issue.service.ts
import { prisma } from '../lib/prisma.js';
import { IssuePriority } from '@prisma/client';
import { NotFoundError, UnprocessableError } from '../lib/errors.js';

export interface CreateIssueParams {
  projectId: string;
  title: string;
  description?: string | null;
  stateId?: string;
  priority?: IssuePriority;
  assigneeId?: string | null;
  dueDate?: Date | null;
  createdById: string;
}

export async function createIssue(params: CreateIssueParams) {
  const {
    projectId,
    title,
    description,
    stateId,
    priority = IssuePriority.MEDIUM,
    assigneeId,
    dueDate,
    createdById,
  } = params;

  return prisma.$transaction(async (tx) => {
    // 1. Fetch project to ensure it exists, is not soft-deleted, and get its defaultStateId
    const project = await tx.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw NotFoundError('Project not found');
    }

    // 2. Validate/Resolve Issue State
    let resolvedStateId = stateId;
    if (!resolvedStateId) {
      if (!project.defaultStateId) {
        throw UnprocessableError('Project has no default state configured');
      }
      resolvedStateId = project.defaultStateId;
    } else {
      const stateExists = await tx.issueState.findFirst({
        where: {
          id: resolvedStateId,
          projectId,
        },
      });
      if (!stateExists) {
        throw UnprocessableError(
          'Issue state does not belong to the project or does not exist',
          'VALIDATION_ERROR',
          [{ field: 'stateId', message: 'Issue state does not belong to the project' }]
        );
      }
    }

    // 3. Validate Assignee (must be a member of the project)
    if (assigneeId) {
      const isMember = await tx.projectMember.findFirst({
        where: {
          projectId,
          userId: assigneeId,
          deletedAt: null,
        },
      });
      if (!isMember) {
        throw UnprocessableError(
          'Assignee must be an active project member',
          'VALIDATION_ERROR',
          [{ field: 'assigneeId', message: 'Assignee must be an active project member' }]
        );
      }
    }

    // 4. Atomically increment issueCounter in project
    const updatedProject = await tx.project.update({
      where: { id: projectId },
      data: {
        issueCounter: { increment: 1 },
      },
      select: {
        key: true,
        issueCounter: true,
      },
    });

    const sequenceId = updatedProject.issueCounter;

    // 5. Create Issue
    const issue = await tx.issue.create({
      data: {
        projectId,
        sequenceId,
        title,
        description,
        stateId: resolvedStateId,
        priority,
        assigneeId,
        createdById,
        dueDate,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        state: true,
      },
    });

    // 6. Create default issue activity "created"
    await tx.issueActivity.create({
      data: {
        issueId: issue.id,
        actorId: createdById,
        verb: 'created',
      },
    });

    // 7. Add computed "key" to the output (e.g. PROJ-1)
    return {
      ...issue,
      key: `${updatedProject.key}-${sequenceId}`,
    };
  });
}

export async function getProjectIssues(projectId: string, groupBy?: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { key: true }
  });
  if (!project) {
    throw NotFoundError('Project not found');
  }

  const issues = await prisma.issue.findMany({
    where: {
      projectId,
      deletedAt: null,
    },
    include: {
      assignee: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      state: true,
    },
    orderBy: {
      sequenceId: 'desc',
    },
  });

  const formattedIssues = issues.map((issue) => ({
    ...issue,
    key: `${project.key}-${issue.sequenceId}`,
  }));

  if (groupBy === 'state') {
    const grouped: Record<string, typeof formattedIssues> = {};
    for (const issue of formattedIssues) {
      const stateName = issue.state.name;
      if (!grouped[stateName]) {
        grouped[stateName] = [];
      }
      grouped[stateName].push(issue);
    }
    return grouped;
  }

  return formattedIssues;
}

export async function getMyIssues(userId: string) {
  const issues = await prisma.issue.findMany({
    where: {
      assigneeId: userId,
      deletedAt: null,
      project: {
        deletedAt: null,
      },
    },
    include: {
      assignee: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      state: true,
      project: {
        select: {
          key: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return issues.map((issue) => ({
    ...issue,
    key: `${issue.project.key}-${issue.sequenceId}`,
  }));
}

