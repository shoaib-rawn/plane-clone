// server/src/routes/projectMember.routes.ts
// ------------------------------------------------------------
// Project member management endpoints (GET, POST, PATCH, DELETE)
// ------------------------------------------------------------
import { Router } from 'express';
import {
  getProjectMembersController,
  addProjectMemberController,
  updateProjectMemberController,
  removeProjectMemberController,
} from '../controllers/projectMember.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';
import { ProjectRole } from '@prisma/client';

export const projectMemberRouter = Router({ mergeParams: true });

// List members – any project member can view
projectMemberRouter.get(
  '/',
  requireAuth,
  requireProjectRole(ProjectRole.VIEWER),
  getProjectMembersController,
);

// Add a member – only ADMIN can add
projectMemberRouter.post(
  '/',
  requireAuth,
  requireProjectRole(ProjectRole.ADMIN),
  addProjectMemberController,
);

// Update a member's role – only ADMIN can update
projectMemberRouter.patch(
  '/:memberId',
  requireAuth,
  requireProjectRole(ProjectRole.ADMIN),
  updateProjectMemberController,
);

// Remove (soft‑delete) a member – only ADMIN can delete
projectMemberRouter.delete(
  '/:memberId',
  requireAuth,
  requireProjectRole(ProjectRole.ADMIN),
  removeProjectMemberController,
);
