import { Request, Response, NextFunction } from 'express';
import { ProjectRole } from '@prisma/client';
import { getEffectiveRole } from '../lib/permissions.js';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../lib/errors.js';

const ROLE_WEIGHTS: Record<ProjectRole, number> = {
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export const requireProjectRole = (neededRole: ProjectRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        throw NotFoundError('Project ID is required in route parameters');
      }

      if (!req.user) {
        throw UnauthorizedError('Not authenticated');
      }

      const userRole = await getEffectiveRole(req.user.id, projectId);

      if (userRole === null) {
        // Return 404 instead of 403 to hide project existence (Chapter 5.4)
        throw NotFoundError('Project not found');
      }

      const userWeight = ROLE_WEIGHTS[userRole];
      const neededWeight = ROLE_WEIGHTS[neededRole];

      if (userWeight < neededWeight) {
        // Return 403 for existing project when user has insufficient permissions
        throw ForbiddenError('Insufficient permissions for this project');
      }

      // Attach the resolved projectRole to the request context
      req.projectRole = userRole;

      next();
    } catch (error) {
      next(error);
    }
  };
};
