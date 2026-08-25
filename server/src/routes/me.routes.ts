// server/src/routes/me.routes.ts
import { Router } from 'express';
import { getMyIssuesController } from '../controllers/issue.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const meIssuesRouter = Router();

// GET /api/v1/me/issues
meIssuesRouter.get('/', requireAuth, getMyIssuesController);
