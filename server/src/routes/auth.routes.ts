// server/src/routes/auth.routes.ts
import { Router } from 'express';
import {
  registerController,
  loginController,
  getMeController,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const authRouter = Router();

authRouter.post('/register', registerController);
authRouter.post('/login', loginController);
authRouter.get('/me', requireAuth, getMeController);
