// server/src/services/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/env.js';
import { ConflictError } from '../lib/errors.js';
import { toPublicUser, PublicUser } from '../lib/user.js';
import { RegisterInput } from '../schemas/auth.schema.js';

export async function registerUser(input: RegisterInput): Promise<{ user: PublicUser; token: string }> {
  // Check if email already registered
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw ConflictError('An account with this email already exists', 'EMAIL_TAKEN');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(input.password, config.bcrypt.rounds);

  // Execute user creation & workspace membership in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        passwordHash,
      },
    });

    // Find default workspace (slug: 'acme') to attach member
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

  // Sign JWT token
  const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });

  return {
    user: toPublicUser(user),
    token,
  };
}
