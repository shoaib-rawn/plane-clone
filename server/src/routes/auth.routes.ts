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
import { authRateLimiter } from '../middleware/rateLimiter.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, registerController);
authRouter.post('/login', authRateLimiter, loginController);
authRouter.post('/logout', logoutController);
authRouter.post('/forgot-password', authRateLimiter, forgotPasswordController);
authRouter.post('/reset-password', authRateLimiter, resetPasswordController);
authRouter.get('/me', requireAuth, getMeController);
