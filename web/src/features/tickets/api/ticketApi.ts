import { API_BASE_URL } from "../../api/baseUrl";
import { apiClient } from "../../api/client";

export type IssuePriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface IssueState {
  id: string;
  name: string;
  group: string;
  colour?: string;
  position?: number;
}

export interface IssueAssignee {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface IssueProject {
  id: string;
  name: string;
  key: string;
}

export interface TicketDetails {
  id: string;
  key: string;
  sequenceId: number;
  title: string;
  description?: string | null;
  priority: IssuePriority;
  dueDate?: string | null;
  completedAt?: string | null;
  assigneeId?: string | null;
  stateId?: string;
  assignee?: IssueAssignee | null;
  state?: IssueState;
  project?: IssueProject;
}

export type CreateTicketPayload = {
  title: string;
  description?: string;
  stateId?: string;
  priority?: IssuePriority;
  assigneeId?: string | null;
  dueDate?: string | null;
};

export type UpdateTicketPayload = {
  title?: string;
  description?: string | null;
  stateId?: string;
  priority?: IssuePriority;
  assigneeId?: string | null;
  dueDate?: string | null;
};

/**
 * Create a new issue/ticket inside a project
 */
export const createTicket = async (projectId: string, payload: CreateTicketPayload) => {
  return apiClient<{ data: TicketDetails }>(`${API_BASE_URL}/projects/${projectId}/issues`, {
    method: "POST",
    body: payload,
  });
};

/**
 * Get all tickets for a project (optionally grouped or filtered)
 */
export const getProjectTickets = async (projectId: string, groupBy?: string) => {
  const query = groupBy ? `?groupBy=${groupBy}` : "";
  return apiClient<any>(`${API_BASE_URL}/projects/${projectId}/issues${query}`);
};

/**
 * Get all tickets assigned to the logged-in user
 */
export const getMyTickets = async () => {
  return apiClient<{ data: TicketDetails[] }>(`${API_BASE_URL}/me/issues`);
};

/**
 * Get a single ticket by its ID with full details
 */
export const getIssueById = async (issueId: string) => {
  return apiClient<{ data: TicketDetails }>(`${API_BASE_URL}/issues/${issueId}`);
};

/**
 * Update issue fields (title, description, status, priority, assignee, due date)
 */
export const updateIssue = async (issueId: string, payload: UpdateTicketPayload) => {
  return apiClient<{ data: TicketDetails }>(`${API_BASE_URL}/issues/${issueId}`, {
    method: "PATCH",
    body: payload,
  });
};

/**
 * Soft-delete an issue
 */
export const deleteIssue = async (issueId: string) => {
  return apiClient<{ data: { message: string } }>(`${API_BASE_URL}/issues/${issueId}`, {
    method: "DELETE",
  });
};
