import { API_BASE_URL } from "../../api/baseUrl";
import { apiClient } from "../../api/client";

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

/**
 * Fetch chronological activity history for a specific issue
 */
export const getIssueActivities = async (issueId: string) => {
  return apiClient<{ data: IssueActivity[] }>(`${API_BASE_URL}/issues/${issueId}/activities`);
};
