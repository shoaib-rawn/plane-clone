import { apiClient } from "./client";
import type { ProjectItem, ProjectRole } from "../types";

export const getProjects = () => {
  return apiClient<{ data: ProjectItem[] }>("/projects");
};

export const getProjectDetails = (projectId: string) => {
  return apiClient<{ data: ProjectItem }>(`/projects/${projectId}`);
};

export const createProject = (payload: { name: string; key: string; description?: string }) => {
  return apiClient<{ data: ProjectItem }>("/projects", {
    method: "POST",
    body: payload,
  });
};

export const updateProject = (
  projectId: string,
  payload: { name?: string; description?: string; defaultStateId?: string }
) => {
  return apiClient<{ data: ProjectItem }>(`/projects/${projectId}`, {
    method: "PATCH",
    body: payload,
  });
};

export const archiveProject = (projectId: string) => {
  return apiClient<{ data: ProjectItem }>(`/projects/${projectId}/archive`, {
    method: "POST",
  });
};

export const unarchiveProject = (projectId: string) => {
  return apiClient<{ data: ProjectItem }>(`/projects/${projectId}/unarchive`, {
    method: "POST",
  });
};

export const deleteProject = (projectId: string) => {
  return apiClient(`/projects/${projectId}`, { method: "DELETE" });
};

export const getProjectMembers = (projectId: string) => {
  return apiClient<{ data: any[] }>(`/projects/${projectId}/members`);
};

export const addProjectMember = (
  projectId: string,
  payload: { userId: string; role: ProjectRole }
) => {
  return apiClient<{ data: any }>(`/projects/${projectId}/members`, {
    method: "POST",
    body: payload,
  });
};

export const updateProjectMemberRole = (
  projectId: string,
  memberId: string,
  payload: { role: ProjectRole }
) => {
  return apiClient<{ data: any }>(`/projects/${projectId}/members/${memberId}`, {
    method: "PATCH",
    body: payload,
  });
};

export const removeProjectMember = (projectId: string, memberId: string) => {
  return apiClient(`/projects/${projectId}/members/${memberId}`, {
    method: "DELETE",
  });
};
