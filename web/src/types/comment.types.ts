/**
 * Discussion Comments Types
 */

export interface CommentAuthor {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface IssueComment {
  id: string;
  issueId?: string;
  authorId?: string;
  author?: CommentAuthor;
  body: string;
  editedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCommentPayload {
  body: string;
}

export interface UpdateCommentPayload {
  body: string;
}
