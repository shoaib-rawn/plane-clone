// server/src/schemas/project.schema.ts
// ------------------------------------------------------------
// Is file ka maksad: client se aane wale project creation request ko validate karna.
// Zod schema se hum ensure karte hain ke:
//   - name required aur max 100 chars
//   - key unique format (uppercase letters/numbers) aur length constraints
//   - description optional lekin max 500 chars
// Ye validation backend ke “Never trust the client” rule (Chapter 17) ko enforce karta hai.
// ------------------------------------------------------------
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

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name cannot be empty').max(100, 'Project name cannot exceed 100 characters').optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
  defaultStateId: z.string().uuid('Invalid default state ID format').optional().nullable(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
