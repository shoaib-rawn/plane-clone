import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, logoutUser } from "./authApi";
import type { User, WorkspaceRole } from "../types";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: meData, isLoading, isError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const meUser = meData?.data?.user;
  const meRole = meData?.data?.workspaceRole;

  const user: User | null = meUser ? (meUser as User) : null;
  const userName = meUser?.displayName || "";
  const workspaceRole: WorkspaceRole | null = meRole || null;
  const isAuthenticated = !isError && !!meUser;

  const login = (loginData: { displayName: string; workspaceRole: WorkspaceRole }) => {
    queryClient.setQueryData(["currentUser"], {
      data: {
        user: { displayName: loginData.displayName },
        workspaceRole: loginData.workspaceRole,
      },
    });
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn("Logout request completed with notice:", err);
    } finally {
      queryClient.setQueryData(["currentUser"], null);
      queryClient.removeQueries({ queryKey: ["currentUser"] });
      queryClient.clear();
    }
  };

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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
