import type { ProjectRole } from "./auth.types";
import type { IssueState } from "./ticket.types";

/**
 * Projects & Project Members Types
 */

export interface ProjectIssueCounts {
  total: number;
  open: number;
  done: number;
  cancelled: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  myRole?: ProjectRole;
  memberCount?: number;
  issueCounts?: ProjectIssueCounts;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectDetails extends ProjectItem {
  states?: IssueState[];
}

export interface ProjectMember {
  id?: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  role: ProjectRole;
  joinedAt?: string;
}

export interface CreateProjectPayload {
  name: string;
  key: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  archivedAt?: string | null;
}

export interface AddProjectMemberPayload {
  projectId: string;
  userId?: string;
  email?: string;
  role: ProjectRole;
}
