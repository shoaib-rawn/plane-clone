// server/src/services/auth.service.ts
import { prisma } from '../lib/prisma.js';
import { ConflictError, UnauthorizedError } from '../lib/errors.js';
import { toPublicUser, PublicUser } from '../lib/user.js';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth.js';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

export async function registerUser(input: RegisterInput): Promise<{ user: PublicUser; token: string }> {
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    // 1. Check existing user inside transaction block using tx
    const existingUser = await tx.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw ConflictError('An account with this email already exists', 'EMAIL_TAKEN');
    }

    // 2. Create new user
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        passwordHash,
      },
    });

    // 3. Find default workspace (slug: 'acme') to attach member
    const workspace = await tx.workspace.findUnique({
      where: { slug: 'acme' },
    });

    // 4. Assign workspace membership
    if (workspace) {
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: newUser.id,
          role: 'MEMBER',
        },
      });
    }

    return newUser;
  });

  const token = generateToken(user.id);

  return {
    user: toPublicUser(user),
    token,
  };
}

export async function loginUser(input: LoginInput): Promise<{ user: PublicUser; token: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  const isPasswordValid = user ? await verifyPassword(input.password, user.passwordHash) : false;

  if (!user || !isPasswordValid || !user.isActive) {
    throw UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = generateToken(user.id);

  return {
    user: toPublicUser(user),
    token,
  };
}
