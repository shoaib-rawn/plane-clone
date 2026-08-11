// server/src/routes/project.routes.ts
import { Router } from 'express';
import { createProjectController } from '../controllers/project.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const projectRouter = Router();

projectRouter.post('/', requireAuth, createProjectController);
