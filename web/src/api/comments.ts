import { apiClient } from "./client";
import type { IssueComment } from "../types";

export const getIssueComments = (issueId: string) => {
  return apiClient<{ data: IssueComment[] }>(`/issues/${issueId}/comments`);
};

export const addIssueComment = (issueId: string, payload: { body: string }) => {
  return apiClient<{ data: IssueComment }>(`/issues/${issueId}/comments`, {
    method: "POST",
    body: payload,
  });
};

export const updateIssueComment = (
  issueId: string,
  commentId: string,
  payload: { body: string }
) => {
  return apiClient<{ data: IssueComment }>(`/issues/${issueId}/comments/${commentId}`, {
    method: "PATCH",
    body: payload,
  });
};

export const deleteIssueComment = (issueId: string, commentId: string) => {
  return apiClient(`/issues/${issueId}/comments/${commentId}`, {
    method: "DELETE",
  });
};
