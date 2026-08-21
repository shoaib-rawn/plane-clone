// server/src/controllers/projectMember.controller.ts
// ------------------------------------------------------------
// Controllers for project member CRUD operations
// ------------------------------------------------------------
import { Request, Response } from 'express';
import {
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} from '../services/projectMember.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { addProjectMemberSchema, updateProjectMemberSchema } from '../schemas/projectMember.schema.js';

// GET /projects/:projectId/members
export const getProjectMembersController = asyncHandler(
  async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const members = await getProjectMembers(projectId);
    return res.status(200).json({ data: members });
  },
);

// POST /projects/:projectId/members
export const addProjectMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { userId, role } = addProjectMemberSchema.parse(req.body);
    const member = await addProjectMember(projectId, userId, role);
    return res.status(201).json({ data: member });
  },
);

// PATCH /projects/:projectId/members/:memberId
export const updateProjectMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const { projectId, memberId } = req.params;
    const { role } = updateProjectMemberSchema.parse(req.body);
    const updated = await updateProjectMemberRole(projectId, memberId, role);
    return res.status(200).json({ data: updated });
  },
);

// DELETE /projects/:projectId/members/:memberId
export const removeProjectMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const { projectId, memberId } = req.params;
    await removeProjectMember(projectId, memberId);
    return res.status(204).send();
  },
);
