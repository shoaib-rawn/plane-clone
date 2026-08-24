// server/src/services/user.service.ts
import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../lib/errors.js';
import { toPublicUser, PublicUser } from '../lib/user.js';
import { UpdateUserInput } from '../schemas/user.schema.js';

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    throw NotFoundError('User profile not found');
  }

  return toPublicUser(user);
}

export async function updateCurrentUser(
  userId: string,
  input: UpdateUserInput
): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    throw NotFoundError('User profile not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    },
  });

  return toPublicUser(updatedUser);
}

export async function getAllUsers(): Promise<PublicUser[]> {
  const users = await prisma.user.findMany({
    where: { isActive: true },
  });
  return users.map(toPublicUser);
}

