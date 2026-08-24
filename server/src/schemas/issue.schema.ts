// server/src/schemas/issue.schema.ts
import { z } from 'zod';
import { IssuePriority } from '@prisma/client';

export const createIssueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title cannot exceed 255 characters'),
  description: z.string().trim().max(10000, 'Description cannot exceed 10000 characters').optional().nullable(),
  stateId: z.string().uuid('Invalid state ID format').optional(),
  priority: z.nativeEnum(IssuePriority).optional().default(IssuePriority.MEDIUM),
  assigneeId: z.string().uuid('Invalid assignee ID format').optional().nullable(),
  dueDate: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() === '') return null;
      return val;
    }, z.union([z.string(), z.date()]))
    .refine(
      (val) => {
        if (val === null || val === undefined) return true;
        return !isNaN(new Date(val).getTime());
      },
      { message: 'Invalid due date format' }
    )
    .transform((val) => {
      if (val === null || val === undefined) return null;
      return new Date(val);
    })
    .optional()
    .nullable(),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
