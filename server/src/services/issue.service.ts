import { prisma } from '../lib/prisma.js';
import { IssuePriority } from '@prisma/client';
import { NotFoundError, UnprocessableError } from '../lib/errors.js';
import { logActivity } from './activity.service.js';

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
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
}

import { CreateIssueInput, UpdateIssueInput, FilterIssuesQuery } from '../schemas/issue.schema.js';

export async function getProjectIssues(projectId: string, query?: Partial<FilterIssuesQuery>) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { key: true },
  });
  if (!project) {
    throw NotFoundError('Project not found');
  }

  const whereClause: any = {
    projectId,
    deletedAt: null,
  };

  if (query?.stateId) {
    whereClause.stateId = query.stateId;
  }
  if (query?.priority) {
    whereClause.priority = query.priority;
  }
  if (query?.assigneeId) {
    whereClause.assigneeId = query.assigneeId;
  }

  const orderByField = query?.orderBy || 'sequenceId';
  const orderDirection = query?.order || 'desc';

  const issues = await prisma.issue.findMany({
    where: whereClause,
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
      [orderByField]: orderDirection,
    },
  });

  const formattedIssues = issues.map((issue) => ({
    ...issue,
    key: `${project.key}-${issue.sequenceId}`,
  }));

  if (query?.groupBy === 'state') {
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

export async function getIssueById(issueId: string) {
  const issue = await prisma.issue.findFirst({
    where: {
      id: issueId,
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
      project: {
        select: {
          id: true,
          name: true,
          key: true,
          workspaceId: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!issue || issue.project.deletedAt !== null) {
    // If issue or its project is deleted, throw 404
    throw NotFoundError('Issue not found');
  }

  return {
    ...issue,
    key: `${issue.project.key}-${issue.sequenceId}`,
  };
}

export async function updateIssue(issueId: string, input: UpdateIssueInput, actorId?: string) {
  // 1. Check issue existence
  const existingIssue = await prisma.issue.findFirst({
    where: { id: issueId, deletedAt: null },
    include: { project: true, state: true },
  });

  if (!existingIssue) {
    throw NotFoundError('Issue not found');
  }

  const updateData: any = {};

  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.priority !== undefined) {
    updateData.priority = input.priority;
  }
  if (input.dueDate !== undefined) {
    updateData.dueDate = input.dueDate;
  }

  // 2. Validate and transition state if stateId provided
  let newTargetStateName: string | null = null;
  if (input.stateId !== undefined && input.stateId !== existingIssue.stateId) {
    const targetState = await prisma.issueState.findFirst({
      where: { id: input.stateId, projectId: existingIssue.projectId },
    });

    if (!targetState) {
      throw UnprocessableError('State does not belong to this project', 'INVALID_STATE');
    }

    updateData.stateId = targetState.id;
    newTargetStateName = targetState.name;

    // Transition completedAt on Done states (StateGroup.completed is 'completed')
    if (targetState.group === 'completed' || targetState.name.toLowerCase() === 'done') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }

  // 3. Validate assignee if assigneeId provided
  if (input.assigneeId !== undefined) {
    if (input.assigneeId !== null) {
      const isMember = await prisma.projectMember.findFirst({
        where: {
          projectId: existingIssue.projectId,
          userId: input.assigneeId,
          deletedAt: null,
        },
      });

      if (!isMember) {
        throw UnprocessableError('Assignee is not a member of this project', 'INVALID_ASSIGNEE');
      }
      updateData.assigneeId = input.assigneeId;
    } else {
      updateData.assigneeId = null;
    }
  }

  // 4. Update the issue
  const updatedIssue = await prisma.issue.update({
    where: { id: issueId },
    data: updateData,
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
          id: true,
          name: true,
          key: true,
          workspaceId: true,
        },
      },
    },
  });

  // 5. Log activities if actor provided
  if (actorId) {
    if (newTargetStateName) {
      await logActivity({
        issueId,
        actorId,
        verb: 'updated_state',
        field: 'state',
        oldValue: existingIssue.state.name,
        newValue: newTargetStateName,
      }).catch(() => {});
    }
    if (input.priority && input.priority !== existingIssue.priority) {
      await logActivity({
        issueId,
        actorId,
        verb: 'updated_priority',
        field: 'priority',
        oldValue: existingIssue.priority,
        newValue: input.priority,
      }).catch(() => {});
    }
    if (input.assigneeId !== undefined && input.assigneeId !== existingIssue.assigneeId) {
      await logActivity({
        issueId,
        actorId,
        verb: 'updated_assignee',
        field: 'assignee',
        oldValue: existingIssue.assigneeId,
        newValue: input.assigneeId,
      }).catch(() => {});
    }
  }

  return {
    ...updatedIssue,
    key: `${updatedIssue.project.key}-${updatedIssue.sequenceId}`,
  };
}

export async function deleteIssue(issueId: string) {
  const existingIssue = await prisma.issue.findFirst({
    where: { id: issueId, deletedAt: null },
  });

  if (!existingIssue) {
    throw NotFoundError('Issue not found');
  }

  await prisma.issue.update({
    where: { id: issueId },
    data: { deletedAt: new Date() },
  });

  return { success: true };
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

