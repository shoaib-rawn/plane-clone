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
import { prisma } from '../lib/prisma.js';
import { DEFAULT_STATES } from '../lib/defaultStates.js';
import { CreateProjectInput } from '../schemas/project.schema.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';

export async function createProject(userId: string, input: CreateProjectInput) {
  // Perform ALL database reads and writes in a single atomic $transaction
  const project = await prisma.$transaction(async (tx) => {
    // 1. Get workspace membership for user inside transaction
    const workspaceMember = await tx.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
    });

    if (!workspaceMember) {
      throw NotFoundError('User does not belong to any workspace');
    }

    const workspaceId = workspaceMember.workspaceId;

    // 2. Check if key already exists in this workspace inside transaction
    const existingProject = await tx.project.findUnique({
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

    // 3. Create the project record
    const newProject = await tx.project.create({
      data: {
        workspaceId,
        name: input.name,
        key: input.key,
        description: input.description,
        createdById: userId,
        issueCounter: 0,
      },
    });

    // 4. Seed the 5 default issue states for this project
    let todoStateId: string | null = null;

    for (const state of DEFAULT_STATES) {
      const createdState = await tx.issueState.create({
        data: {
          projectId: newProject.id,
          name: state.name,
          group: state.group,
          colour: state.colour,
          position: state.position,
        },
      });

      if (state.name === 'Todo') {
        todoStateId = createdState.id;
      }
    }

    // 5. Assign creator as Project Admin
    await tx.projectMember.create({
      data: {
        projectId: newProject.id,
        userId,
        role: 'ADMIN',
      },
    });

    // 6. Update project with defaultStateId
    const updatedProject = await tx.project.update({
      where: { id: newProject.id },
      data: { defaultStateId: todoStateId },
      include: {
        states: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return updatedProject;
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

