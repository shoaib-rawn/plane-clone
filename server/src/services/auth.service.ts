// server/src/services/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/env.js';
import { ConflictError, UnauthorizedError } from '../lib/errors.js';
import { toPublicUser, PublicUser } from '../lib/user.js';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

export async function registerUser(input: RegisterInput): Promise<{ user: PublicUser; token: string }> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw ConflictError('An account with this email already exists', 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(input.password, config.bcrypt.rounds);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        passwordHash,
      },
    });

    const workspace = await tx.workspace.findUnique({
      where: { slug: 'acme' },
    });

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

  const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });

  return {
    user: toPublicUser(user),
    token,
  };
}

export async function loginUser(input: LoginInput): Promise<{ user: PublicUser; token: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  const isPasswordValid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;

  if (!user || !isPasswordValid || !user.isActive) {
    throw UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });

  return {
    user: toPublicUser(user),
    token,
  };
}
