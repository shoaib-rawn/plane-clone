// server/src/services/project.service.ts
// ------------------------------------------------------------
// This service function `createProject` creates a new project and inserts
// all related data in a single atomic Prisma `$transaction`. This ensures:
//   • Data consistency (any failure rolls back the whole transaction)
//   • Uniqueness check for the project key and creation of default issue states
//   • Assignment of the creator as Project Admin
//   • Setting the default 'Todo' state as the project's `defaultStateId`
// All of these steps keep business logic in the service layer (Downwards‑Only architecture).
// ------------------------------------------------------------
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { DEFAULT_STATES } from '../lib/defaultStates.js';
import { CreateProjectInput } from '../schemas/project.schema.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../lib/errors.js';

export async function createProject(userId: string, input: CreateProjectInput) {
  // 1. Get workspace membership for user outside transaction
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true, role: true },
  });

  if (!workspaceMember) {
    throw NotFoundError('User does not belong to any workspace');
  }

  if (workspaceMember.role !== 'ADMIN') {
    throw ForbiddenError('Only workspace administrators can create projects');
  }

  const workspaceId = workspaceMember.workspaceId;

  // 2. Check if key already exists in this workspace outside transaction
  const existingProject = await prisma.project.findUnique({
    where: {
      workspaceId_key: {
        workspaceId,
        key: input.key,
      },
    },
  });

  if (existingProject) {
    throw ConflictError(
      `Project key '${input.key}' already exists in this workspace`,
      'PROJECT_KEY_TAKEN'
    );
  }

  // Pre-generate UUIDs for default states so we can insert project with defaultStateId directly!
  const todoStateId = crypto.randomUUID();
  const stateIds: Record<string, string> = {
    'Backlog': crypto.randomUUID(),
    'Todo': todoStateId,
    'In Progress': crypto.randomUUID(),
    'Done': crypto.randomUUID(),
    'Cancelled': crypto.randomUUID(),
  };

  // Perform ONLY sequential writes inside transaction
  const project = await prisma.$transaction(async (tx) => {
    // 3. Create the project record with defaultStateId already populated!
    const newProject = await tx.project.create({
      data: {
        workspaceId,
        name: input.name,
        key: input.key,
        description: input.description,
        createdById: userId,
        issueCounter: 0,
        defaultStateId: todoStateId,
      },
    });

    // 4. Seed the 5 default issue states in a single bulk INSERT query (createMany)
    await tx.issueState.createMany({
      data: DEFAULT_STATES.map((state) => ({
        id: stateIds[state.name],
        projectId: newProject.id,
        name: state.name,
        group: state.group,
        colour: state.colour,
        position: state.position,
      })),
    });

    // 5. Assign creator as Project Admin
    await tx.projectMember.create({
      data: {
        projectId: newProject.id,
        userId,
        role: 'ADMIN',
      },
    });

    // Fetch states to return
    const finalProject = await tx.project.findUnique({
      where: { id: newProject.id },
      include: {
        states: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return finalProject!;
  }, {
    maxWait: 10000,
    timeout: 20000,
  });

  return {
    ...project,
    myRole: 'ADMIN',
  };
}

export async function getProjectsForUser(userId: string) {
  // 1. Get workspace membership for user to determine workspace ID and Workspace Role
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true, role: true },
  });

  if (!workspaceMember) {
    throw NotFoundError('User does not belong to any workspace');
  }

  const { workspaceId, role: workspaceRole } = workspaceMember;

  // 2. Fetch projects depending on Workspace Role (Workspace ADMIN sees all, MEMBER sees joined only)
  const projectFilters: any = {
    workspaceId,
    deletedAt: null,
  };

  if (workspaceRole !== 'ADMIN') {
    projectFilters.members = {
      some: { userId },
    };
  }

  const projects = await prisma.project.findMany({
    where: projectFilters,
    include: {
      members: {
        where: { userId },
      },
      states: {
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });


  // 3. For each project, determine the role and count issues
  const result = await Promise.all(
    projects.map(async (project) => {
      // Determine user's project role
      let myRole: string;
      if (workspaceRole === 'ADMIN') {
        myRole = 'ADMIN';
      } else {
        const membership = project.members[0];
        myRole = membership ? membership.role : 'VIEWER';
      }

      // Count open and completed issues
      const [openIssuesCount, doneIssuesCount] = await Promise.all([
        prisma.issue.count({
          where: {
            projectId: project.id,
            deletedAt: null,
            state: {
              group: {
                notIn: ['completed', 'cancelled'],
              },
            },
          },
        }),
        prisma.issue.count({
          where: {
            projectId: project.id,
            deletedAt: null,
            state: {
              group: 'completed',
            },
          },
        }),
      ]);

      // Remove nested members array from final output for cleaner structure
      const { members, ...projectData } = project;

      return {
        ...projectData,
        myRole,
        openIssuesCount,
        doneIssuesCount,
      };
    })
  );

  return result;
}

export async function getProjectById(userId: string, projectId: string) {
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true, role: true },
  });

  if (!workspaceMember) {
    throw NotFoundError('User does not belong to any workspace');
  }

  const { workspaceId, role: workspaceRole } = workspaceMember;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId,
      deletedAt: null,
    },
    include: {
      members: {
        where: { userId },
      },
      states: {
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!project) {
    throw NotFoundError('Project not found');
  }

  let myRole: string;
  if (workspaceRole === 'ADMIN') {
    myRole = 'ADMIN';
  } else {
    const membership = project.members[0];
    myRole = membership ? membership.role : 'VIEWER';
  }

  const [openIssuesCount, doneIssuesCount] = await Promise.all([
    prisma.issue.count({
      where: {
        projectId: project.id,
        deletedAt: null,
        state: {
          group: {
            notIn: ['completed', 'cancelled'],
          },
        },
      },
    }),
    prisma.issue.count({
      where: {
        projectId: project.id,
        deletedAt: null,
        state: {
          group: {
            in: ['completed'],
          },
        },
      },
    }),
  ]);

  const { members, ...projectData } = project;

  return {
    ...projectData,
    myRole,
    openIssuesCount,
    doneIssuesCount,
  };
}

import { UpdateProjectInput } from '../schemas/project.schema.js';
import { UnprocessableError } from '../lib/errors.js';

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });

  if (!project) {
    throw NotFoundError('Project not found');
  }

  const updateData: any = {};
  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.defaultStateId !== undefined) {
    if (input.defaultStateId !== null) {
      const state = await prisma.issueState.findFirst({
        where: { id: input.defaultStateId, projectId },
      });
      if (!state) {
        throw UnprocessableError('State does not belong to this project', 'INVALID_DEFAULT_STATE');
      }
      updateData.defaultStateId = input.defaultStateId;
    } else {
      updateData.defaultStateId = null;
    }
  }

  return prisma.project.update({
    where: { id: projectId },
    data: updateData,
    include: {
      states: {
        orderBy: { position: 'asc' },
      },
    },
  });
}

export async function archiveProject(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });

  if (!project) {
    throw NotFoundError('Project not found');
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { archivedAt: new Date() },
  });

  return {
    message: 'Project archived successfully',
    archivedAt: updated.archivedAt,
  };
}

export async function unarchiveProject(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });

  if (!project) {
    throw NotFoundError('Project not found');
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { archivedAt: null },
  });

  return {
    message: 'Project unarchived successfully',
  };
}

export async function deleteProject(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });

  if (!project) {
    throw NotFoundError('Project not found');
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { deletedAt: new Date() },
  });

  return {
    message: 'Project deleted successfully',
  };
}


