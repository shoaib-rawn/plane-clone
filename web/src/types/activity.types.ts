/**
 * Issue Activities / Audit Log Types
 */

export interface ActivityActor {
  id: string;
  displayName: string;
}

export interface IssueActivity {
  id: string;
  verb: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  actor?: ActivityActor;
}
