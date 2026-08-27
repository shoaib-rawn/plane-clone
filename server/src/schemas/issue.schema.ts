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

export const updateIssueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title cannot exceed 255 characters')
    .optional(),
  description: z.string().trim().max(10000, 'Description cannot exceed 10000 characters').optional().nullable(),
  stateId: z.string().uuid('Invalid state ID format').optional(),
  priority: z.nativeEnum(IssuePriority).optional(),
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

export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;

export const filterIssuesQuerySchema = z.object({
  stateId: z.string().uuid().optional(),
  priority: z.nativeEnum(IssuePriority).optional(),
  assigneeId: z.string().uuid().optional(),
  groupBy: z.enum(['state']).optional(),
  orderBy: z.enum(['createdAt', 'sequenceId', 'priority', 'dueDate']).optional().default('sequenceId'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type FilterIssuesQuery = z.infer<typeof filterIssuesQuerySchema>;

