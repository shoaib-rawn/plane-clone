import { API_BASE_URL } from "../../api/baseUrl";
import { apiClient } from "../../api/client";

export interface ProjectState {
  id: string;
  name: string;
  group: string;
  colour?: string;
  position?: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  myRole?: "ADMIN" | "MEMBER" | "VIEWER";
  openIssuesCount?: number;
  doneIssuesCount?: number;
  archivedAt?: string | null;
  deletedAt?: string | null;
  states?: ProjectState[];
}

export type CreateProjectPayload = {
  name: string;
  key: string;
  description?: string;
};

export type UpdateProjectPayload = {
  name?: string;
  description?: string;
  defaultStateId?: string;
};

export type ProjectMemberPayload = {
  userId: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
};

export type ProjectMemberRolePayload = {
  role: "ADMIN" | "MEMBER" | "VIEWER";
};

export const createProject = async (payload: CreateProjectPayload) => {
  return apiClient<{ data: ProjectItem }>(`${API_BASE_URL}/projects`, {
    method: "POST",
    body: payload,
  });
};

export const getProjects = async () => {
  return apiClient<{ data: ProjectItem[] }>(`${API_BASE_URL}/projects`);
};

export const getProjectDetails = async (projectId: string) => {
  return apiClient<{ data: ProjectItem }>(`${API_BASE_URL}/projects/${projectId}`);
};

export const updateProject = async (projectId: string, payload: UpdateProjectPayload) => {
  return apiClient<{ data: ProjectItem }>(`${API_BASE_URL}/projects/${projectId}`, {
    method: "PATCH",
    body: payload,
  });
};

export const archiveProject = async (projectId: string) => {
  return apiClient<{ data: ProjectItem }>(`${API_BASE_URL}/projects/${projectId}/archive`, {
    method: "POST",
  });
};

export const unarchiveProject = async (projectId: string) => {
  return apiClient<{ data: ProjectItem }>(`${API_BASE_URL}/projects/${projectId}/unarchive`, {
    method: "POST",
  });
};

export const deleteProject = async (projectId: string) => {
  return apiClient<{ data: { message: string } }>(`${API_BASE_URL}/projects/${projectId}`, {
    method: "DELETE",
  });
};

export const getProjectMembers = async (projectId: string) => {
  return apiClient<{ data: any[] }>(`${API_BASE_URL}/projects/${projectId}/members`);
};

export const addProjectMember = async (
  projectId: string,
  payload: ProjectMemberPayload
) => {
  return apiClient(`${API_BASE_URL}/projects/${projectId}/members`, {
    method: "POST",
    body: payload,
  });
};

export const updateProjectMemberRole = async (
  projectId: string,
  memberId: string,
  payload: ProjectMemberRolePayload
) => {
  return apiClient(`${API_BASE_URL}/projects/${projectId}/members/${memberId}`, {
    method: "PATCH",
    body: payload,
  });
};

export const removeProjectMember = async (projectId: string, memberId: string) => {
  return apiClient(`${API_BASE_URL}/projects/${projectId}/members/${memberId}`, {
    method: "DELETE",
  });
};
