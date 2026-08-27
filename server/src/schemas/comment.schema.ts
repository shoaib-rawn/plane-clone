// server/src/schemas/comment.schema.ts
import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Comment body is required')
    .max(5000, 'Comment cannot exceed 5000 characters'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Comment body is required')
    .max(5000, 'Comment cannot exceed 5000 characters'),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
