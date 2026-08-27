// server/src/routes/project.routes.ts
// ------------------------------------------------------------
// Ye router project‑related API endpoints ko group karta hai.
// Currently sirf `POST /` endpoint hai jo naya project create karta hai.
// Middleware chain:
//   - `requireAuth` ensures the request is authenticated.
//   - `createProjectController` handles validation, calls the service, and returns the response.
// Future me GET/PUT/DELETE routes bhi isi file me add kiye jayenge.
// ------------------------------------------------------------
import { Router } from 'express';
import {
  createProjectController,
  getProjectsController,
  updateProjectController,
  archiveProjectController,
  unarchiveProjectController,
  deleteProjectController,
} from '../controllers/project.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';
import { ProjectRole } from '@prisma/client';
import { projectMemberRouter } from './projectMember.routes.js';
import { issueRouter } from './issue.routes.js';

export const projectRouter = Router();

projectRouter.post('/', requireAuth, createProjectController);
projectRouter.get('/', requireAuth, getProjectsController);

projectRouter.patch(
  '/:projectId',
  requireAuth,
  requireProjectRole(ProjectRole.ADMIN),
  updateProjectController
);
projectRouter.post(
  '/:projectId/archive',
  requireAuth,
  requireProjectRole(ProjectRole.ADMIN),
  archiveProjectController
);
projectRouter.post(
  '/:projectId/unarchive',
  requireAuth,
  requireProjectRole(ProjectRole.ADMIN),
  unarchiveProjectController
);
projectRouter.delete(
  '/:projectId',
  requireAuth,
  requireProjectRole(ProjectRole.ADMIN),
  deleteProjectController
);

projectRouter.use('/:projectId/members', projectMemberRouter);
projectRouter.use('/:projectId/issues', issueRouter);


