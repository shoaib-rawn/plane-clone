// server/src/schemas/auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name cannot exceed 100 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
