import { API_BASE_URL } from "../../api/baseUrl";
import { apiClient } from "../../api/client";

export interface CommentAuthor {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface IssueComment {
  id: string;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  authorId?: string;
  author: CommentAuthor;
}

export interface CreateCommentPayload {
  body: string;
}

export interface UpdateCommentPayload {
  body: string;
}

/**
 * Fetch all active discussion comments for an issue
 */
export const getIssueComments = async (issueId: string) => {
  return apiClient<{ data: IssueComment[] }>(`${API_BASE_URL}/issues/${issueId}/comments`);
};

/**
 * Add a new comment to an issue
 */
export const addIssueComment = async (issueId: string, payload: CreateCommentPayload) => {
  return apiClient<{ data: IssueComment }>(`${API_BASE_URL}/issues/${issueId}/comments`, {
    method: "POST",
    body: payload,
  });
};

/**
 * Update an existing comment (author only)
 */
export const updateIssueComment = async (
  issueId: string,
  commentId: string,
  payload: UpdateCommentPayload
) => {
  return apiClient<{ data: IssueComment }>(`${API_BASE_URL}/issues/${issueId}/comments/${commentId}`, {
    method: "PATCH",
    body: payload,
  });
};

/**
 * Delete a comment (author or project admin)
 */
export const deleteIssueComment = async (issueId: string, commentId: string) => {
  return apiClient<{ data: { message: string } }>(`${API_BASE_URL}/issues/${issueId}/comments/${commentId}`, {
    method: "DELETE",
  });
};
