import { prisma } from '../lib/prisma.js';
import { ProjectRole } from '@prisma/client';
import { ConflictError, NotFoundError, ForbiddenError } from '../lib/errors.js';

export async function getProjectMembers(projectId: string) {
  return prisma.projectMember.findMany({
    where: {
      projectId,
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'asc',
    },
  });
}

export async function addProjectMember(projectId: string, userId: string, role: ProjectRole) {
  // 1. Check if user exists
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!userExists) {
    throw NotFoundError('User not found');
  }

  // 2. Check if project exists to get its workspaceId
  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
  });
  if (!project) {
    throw NotFoundError('Project not found');
  }

  // 3. Verify user belongs to the project's workspace
  const workspaceMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: project.workspaceId,
        userId,
      },
    },
  });
  if (!workspaceMember) {
    throw ForbiddenError('User is not a member of this workspace');
  }

  // 4. Check if project membership already exists (including soft-deleted)
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (existingMember) {
    if (existingMember.deletedAt === null) {
      throw ConflictError('User is already a member of this project', 'MEMBER_ALREADY_EXISTS');
    } else {
      // Restore soft-deleted member
      return prisma.projectMember.update({
        where: {
          id: existingMember.id,
        },
        data: {
          role,
          deletedAt: null,
          joinedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
              isActive: true,
            },
          },
        },
      });
    }
  }

  // 5. Create new membership
  return prisma.projectMember.create({
    data: {
      projectId,
      userId,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          isActive: true,
        },
      },
    },
  });
}

export async function updateProjectMemberRole(projectId: string, memberId: string, role: ProjectRole) {
  const existingMember = await prisma.projectMember.findFirst({
    where: {
      id: memberId,
      projectId,
      deletedAt: null,
    },
  });

  if (!existingMember) {
    throw NotFoundError('Project member not found');
  }

  return prisma.projectMember.update({
    where: { id: memberId },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          isActive: true,
        },
      },
    },
  });
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const existingMember = await prisma.projectMember.findFirst({
    where: {
      id: memberId,
      projectId,
      deletedAt: null,
    },
  });

  if (!existingMember) {
    throw NotFoundError('Project member not found');
  }

  await prisma.projectMember.update({
    where: { id: memberId },
    data: { deletedAt: new Date() },
  });
}
