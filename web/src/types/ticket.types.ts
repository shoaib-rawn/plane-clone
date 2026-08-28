/**
 * Ticket / Issue Types
 */

export type IssuePriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export type StateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export interface IssueState {
  id: string;
  name: string;
  group: StateGroup;
  colour: string;
  position: number;
}

export interface TicketAssignee {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface TicketReporter {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface TicketDetails {
  id: string;
  sequenceId: number;
  key?: string;
  title: string;
  description?: string | null;
  priority: IssuePriority;
  dueDate?: string | null;
  completedAt?: string | null;
  stateId?: string;
  state?: IssueState;
  assigneeId?: string | null;
  assignee?: TicketAssignee | null;
  createdById?: string;
  createdBy?: TicketReporter;
  project?: {
    id: string;
    key: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTicketPayload {
  title: string;
  description?: string;
  stateId?: string;
  priority?: IssuePriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string | null;
  stateId?: string;
  priority?: IssuePriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}
