// server/src/schemas/project.schema.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name cannot exceed 100 characters'),
  key: z
    .string()
    .min(2, 'Project key must be at least 2 characters')
    .max(10, 'Project key cannot exceed 10 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Project key must contain only letters and numbers')
    .transform((val) => val.toUpperCase()),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
