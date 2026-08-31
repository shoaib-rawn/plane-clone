// server/src/routes/auth.routes.ts
import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController,
  getMeController,
  forgotPasswordController,
  resetPasswordController,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const authRouter = Router();

authRouter.post('/register', registerController);
authRouter.post('/create-user', registerController);
authRouter.post('/login', loginController);
authRouter.post('/logout', logoutController);
authRouter.post('/forgot-password', forgotPasswordController);
authRouter.post('/reset-password', resetPasswordController);
authRouter.get('/me', requireAuth, getMeController);
