// server/src/services/auth.service.ts
import { prisma } from '../lib/prisma.js';
import { ConflictError, UnauthorizedError } from '../lib/errors.js';
import { toPublicUser, PublicUser } from '../lib/user.js';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth.js';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

export async function registerUser(input: RegisterInput): Promise<{ user: PublicUser; workspaceRole: string; token: string }> {
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
    workspaceRole: 'MEMBER' as const,
    token,
  };
}

const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';

export async function loginUser(input: LoginInput): Promise<{ user: PublicUser; workspaceRole: string; token: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  const passwordHashToVerify = user ? user.passwordHash : DUMMY_HASH;
  const isPasswordValid = await verifyPassword(input.password, passwordHashToVerify);

  if (!user || !isPasswordValid || !user.isActive) {
    throw UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = generateToken(user.id);

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { role: true },
  });

  return {
    user: toPublicUser(user),
    workspaceRole: workspaceMember?.role || 'MEMBER',
    token,
  };
}

import { generateResetToken, verifyResetToken } from '../lib/auth.js';
import { sendPasswordResetEmail } from '../lib/mailer.js';
import { BadRequestError } from '../lib/errors.js';

export async function requestPasswordReset(email: string, clientOrigin?: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user && user.isActive) {
    try {
      const resetToken = generateResetToken(user.id);
      const origin = clientOrigin || 'http://localhost:5173';
      const resetLink = `${origin}/reset-password?token=${resetToken}`;

      console.log(`[MAILER] Sending password reset email to: ${user.email}`);
      console.log(`[MAILER] Reset link: ${resetLink}`);

      await sendPasswordResetEmail(user.email, resetLink, user.displayName);
      console.log(`[MAILER] Password reset email successfully dispatched to Mailtrap for: ${user.email}`);
    } catch (err) {
      console.error('[MAILER ERROR] Failed to send password reset email via Mailtrap:', err);
    }
  } else {
    console.log(`[MAILER] Reset requested for email not in database: ${email}`);
  }

  // Consistent message to prevent email enumeration
  return {
    message: 'If an account with that email exists, a password reset link has been sent to your inbox.',
  };
}

export async function resetPassword(token: string, newPassword: string) {
  let userId: string;
  try {
    const verified = verifyResetToken(token);
    userId = verified.userId;
  } catch {
    throw BadRequestError('Invalid or expired password reset token', 'INVALID_RESET_TOKEN');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    throw BadRequestError('User account is invalid or inactive', 'USER_NOT_FOUND');
  }

  const newPasswordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
    },
  });

  return {
    message: 'Password reset successfully. You may now log in with your new password.',
  };
}

