import { prisma } from './prisma.js';
import { ProjectRole } from '@prisma/client';

export async function getEffectiveRole(
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  // 1. Fetch project to check workspaceId and soft-delete status
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      workspaceId: true,
      deletedAt: true,
    },
  });

  if (!project || project.deletedAt !== null) {
    return null;
  }

  // 2. Fetch workspace membership for the user
  const workspaceMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: project.workspaceId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!workspaceMember) {
    return null;
  }

  // 3. Workspace ADMIN gets implicit ADMIN access on all projects in the workspace
  if (workspaceMember.role === 'ADMIN') {
    return 'ADMIN';
  }

  // 4. Check project-level membership
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!projectMember) {
    return null;
  }

  return projectMember.role;
}
