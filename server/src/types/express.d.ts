// server/src/types/express.d.ts
import { PublicUser } from '../lib/user.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}
