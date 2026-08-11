// server/src/services/project.service.ts
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
