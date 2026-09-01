export type WorkspaceRole = "ADMIN" | "MEMBER";
export type ProjectRole = "ADMIN" | "MEMBER" | "VIEWER";
export type IssuePriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface User {
  id?: string;
  email?: string;
  displayName: string;
  avatarUrl?: string | null;
  role?: WorkspaceRole;
}

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
  myRole?: ProjectRole;
  openIssuesCount?: number;
  doneIssuesCount?: number;
  archivedAt?: string | null;
  deletedAt?: string | null;
  states?: ProjectState[];
}

export interface TicketDetails {
  id: string;
  key: string;
  sequenceId?: number;
  title: string;
  description?: string | null;
  priority: IssuePriority;
  dueDate?: string | null;
  completedAt?: string | null;
  assigneeId?: string | null;
  stateId?: string;
  assignee?: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  state?: ProjectState;
  project?: {
    id: string;
    name: string;
    key: string;
  };
}

export interface IssueComment {
  id: string;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  authorId?: string;
  author: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface IssueActivity {
  id: string;
  verb: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    displayName: string;
  };
}
