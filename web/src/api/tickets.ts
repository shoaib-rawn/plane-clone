import { apiClient } from "./client";
import type { TicketDetails, IssuePriority } from "../types";

export const getProjectTickets = (projectId: string) => {
  return apiClient<{ data: TicketDetails[] }>(`/projects/${projectId}/issues`);
};

export const getMyTickets = () => {
  return apiClient<{ data: TicketDetails[] }>("/issues/my-issues");
};

export const getTicketDetails = (ticketId: string) => {
  return apiClient<{ data: TicketDetails }>(`/issues/${ticketId}`);
};

export const createTicket = (
  projectId: string,
  payload: {
    title: string;
    description?: string;
    stateId?: string;
    priority?: IssuePriority;
    assigneeId?: string | null;
    dueDate?: string | null;
  }
) => {
  return apiClient<{ data: TicketDetails }>(`/projects/${projectId}/issues`, {
    method: "POST",
    body: payload,
  });
};

export const updateTicket = (
  ticketId: string,
  payload: {
    title?: string;
    description?: string | null;
    stateId?: string;
    priority?: IssuePriority;
    assigneeId?: string | null;
    dueDate?: string | null;
  }
) => {
  return apiClient<{ data: TicketDetails }>(`/issues/${ticketId}`, {
    method: "PATCH",
    body: payload,
  });
};

export const deleteTicket = (ticketId: string) => {
  return apiClient(`/issues/${ticketId}`, { method: "DELETE" });
};

export const updateTicketState = (ticketId: string, stateId: string) => {
  return apiClient<{ data: TicketDetails }>(`/issues/${ticketId}/state`, {
    method: "PATCH",
    body: { stateId },
  });
};

export const getIssueById = getTicketDetails;
export const updateIssue = updateTicket;
export const deleteIssue = deleteTicket;
