// server/src/schemas/user.schema.ts
import { z } from 'zod';

export const updateUserSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name cannot be empty')
    .max(100, 'Display name cannot exceed 100 characters')
    .optional(),
  avatarUrl: z.string().url('Invalid avatar URL format').nullable().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
