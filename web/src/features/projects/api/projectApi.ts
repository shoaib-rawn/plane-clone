import { API_BASE_URL } from "../../api/baseUrl";
import { apiClient } from "../../api/client";

export type CreateProjectPayload = {
  name: string;
  key: string;
  description?: string;
};

export type ProjectMemberPayload = {
  userId: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
};

export type ProjectMemberRolePayload = {
  role: "ADMIN" | "MEMBER" | "VIEWER";
};

export const createProject = async (payload: CreateProjectPayload) => {
  return apiClient(`${API_BASE_URL}/projects`, {
    method: "POST",
    body: payload,
  });
};

export const getProjects = async () => {
  return apiClient(`${API_BASE_URL}/projects`);
};

export const getProjectMembers = async (projectId: string) => {
  return apiClient(`${API_BASE_URL}/projects/${projectId}/members`);
};

export const addProjectMember = async (
  projectId: string,
  payload: ProjectMemberPayload,
) => {
  return apiClient(`${API_BASE_URL}/projects/${projectId}/members`, {
    method: "POST",
    body: payload,
  });
};

export const updateProjectMemberRole = async (
  projectId: string,
  memberId: string,
  payload: ProjectMemberRolePayload,
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
