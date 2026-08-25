// server/src/schemas/projectMember.schema.ts
import { z } from 'zod';
import { ProjectRole } from '@prisma/client';

export const addProjectMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  role: z.nativeEnum(ProjectRole, {
    errorMap: () => ({ message: 'Invalid project role' }),
  }),
});

export const updateProjectMemberSchema = z.object({
  role: z.nativeEnum(ProjectRole, {
    errorMap: () => ({ message: 'Invalid project role' }),
  }),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberSchema>;
