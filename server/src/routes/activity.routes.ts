// server/src/routes/activity.routes.ts
import { Router } from 'express';
import { getIssueActivitiesController } from '../controllers/activity.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const activityRouter = Router({ mergeParams: true });

activityRouter.get('/', requireAuth, getIssueActivitiesController);
