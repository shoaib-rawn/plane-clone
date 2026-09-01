import { apiClient } from "./client";
import type { IssueActivity } from "../types";

export const getIssueActivities = (issueId: string) => {
  return apiClient<{ data: IssueActivity[] }>(`/issues/${issueId}/activities`);
};
