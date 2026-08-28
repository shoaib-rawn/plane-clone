/**
 * Authentication & User Roles Types
 */

export type WorkspaceRole = "ADMIN" | "MEMBER";

export type ProjectRole = "ADMIN" | "MEMBER" | "VIEWER";

export interface User {
  id?: string;
  email?: string;
  displayName: string;
  avatarUrl?: string | null;
  role?: WorkspaceRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginResponse {
  data: {
    token: string;
    workspaceRole: WorkspaceRole;
    user: {
      id?: string;
      email?: string;
      displayName: string;
      avatarUrl?: string | null;
    };
  };
}

export interface AuthContextType {
  user: User | null;
  userName: string;
  workspaceRole: WorkspaceRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: { displayName: string; workspaceRole: WorkspaceRole }) => void;
  logout: () => void;
  updateUser: (updates: { displayName?: string; workspaceRole?: WorkspaceRole }) => void;
}
