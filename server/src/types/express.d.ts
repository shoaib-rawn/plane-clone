// server/src/types/express.d.ts
import { PublicUser } from '../lib/user.js';
import { ProjectRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      projectRole?: ProjectRole;
    }
  }
}
