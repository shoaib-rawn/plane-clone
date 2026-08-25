import { API_BASE_URL } from "../../api/baseUrl";
import { apiClient } from "../../api/client";

export type CreateTicketPayload = {
  title: string;
  description?: string;
  stateId?: string;
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  assigneeId?: string | null;
  dueDate?: string | null;
};

export const createTicket = async (projectId: string, payload: CreateTicketPayload) => {
  return apiClient(`${API_BASE_URL}/projects/${projectId}/issues`, {
    method: "POST",
    body: payload,
  });
};

export const getProjectTickets = async (projectId: string, groupBy?: string) => {
  const query = groupBy ? `?groupBy=${groupBy}` : "";
  return apiClient<any>(`${API_BASE_URL}/projects/${projectId}/issues${query}`);
};

export const getMyTickets = async () => {
  return apiClient<any>(`${API_BASE_URL}/me/issues`);
};
