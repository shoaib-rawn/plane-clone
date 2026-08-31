import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, logoutUser } from "../features/auth/api/authApi";
import type { User, WorkspaceRole } from "../types";

/**
 * Authentication Context Contract
 * Supports secure httpOnly cookie sessions with zero localStorage vulnerability
 */
export interface AuthContextType {
  user: User | null;
  userName: string;
  workspaceRole: WorkspaceRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: { displayName: string; workspaceRole: WorkspaceRole }) => void;
  logout: () => Promise<void>;
  updateUser: (updates: { displayName?: string; workspaceRole?: WorkspaceRole }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider: Manages authenticated session using React Query and HttpOnly cookies
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // 1. Initial Session Check: React Query GET /api/v1/auth/me
  const {
    data: meData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getMe,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh in cache
  });

  const meUser = meData?.data?.user;
  const meRole = meData?.data?.workspaceRole;

  const user: User | null = meUser ? (meUser as User) : null;
  const userName = meUser?.displayName || "";
  const workspaceRole: WorkspaceRole | null = meRole || null;
  const isAuthenticated = !isError && !!meUser;

  // 2. Login Handler: Invalidates and refetches currentUser
  const login = (_loginData: { displayName: string; workspaceRole: WorkspaceRole }) => {
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  };

  // 3. Logout Handler: Calls POST /auth/logout, removes currentUser and clears private cache
  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn("Logout request completed with notice:", err);
    } finally {
      queryClient.removeQueries({ queryKey: ["currentUser"] });
      queryClient.clear();
    }
  };

  // 4. Update Profile: Sync display name in React Query cache
  const updateUser = (updates: { displayName?: string; workspaceRole?: WorkspaceRole }) => {
    queryClient.setQueryData(["currentUser"], (old: any) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: {
          ...old.data,
          user: updates.displayName !== undefined ? { ...old.data.user, displayName: updates.displayName } : old.data.user,
          workspaceRole: updates.workspaceRole !== undefined ? updates.workspaceRole : old.data.workspaceRole,
        },
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userName,
        workspaceRole,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom Hook: useAuth()
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
