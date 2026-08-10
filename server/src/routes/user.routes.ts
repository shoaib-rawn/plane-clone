// server/src/routes/user.routes.ts
import { Router } from 'express';
import { updateMeController } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const userRouter = Router();

userRouter.patch('/me', requireAuth, updateMeController);
