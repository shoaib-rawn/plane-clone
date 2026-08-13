// server/src/routes/user.routes.ts
import { Router } from 'express';
import { updateMeController } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getAllUsersController } from '../controllers/user.controller.js';
export const userRouter = Router();

userRouter.patch('/me', requireAuth, updateMeController);
userRouter.get('/', requireAuth, getAllUsersController);