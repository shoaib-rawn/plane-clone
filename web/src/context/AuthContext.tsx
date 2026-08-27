import React, { createContext, useContext, useState, useEffect } from "react";
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
 * AuthProvider: Manages authenticated session using secure httpOnly cookies
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userName, setUserName] = useState<string>("");
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Initial Session Check: Verify session cookie via GET /api/v1/auth/me
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const res = await getMe();
        const meUser = res.data.user;
        const meRole = res.data.workspaceRole;

        setUser(meUser as User);
        setUserName(meUser.displayName || "");
        setWorkspaceRole(meRole);
        setIsAuthenticated(true);
      } catch (err) {
        // No active session cookie or expired
        setUser(null);
        setUserName("");
        setWorkspaceRole(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 2. Login Handler: Updates in-memory state (Cookie is handled automatically by browser)
  const login = (loginData: { displayName: string; workspaceRole: WorkspaceRole }) => {
    setUserName(loginData.displayName);
    setWorkspaceRole(loginData.workspaceRole);
    setUser({ displayName: loginData.displayName, role: loginData.workspaceRole });
    setIsAuthenticated(true);
  };

  // 3. Logout Handler: Calls POST /auth/logout to clear cookie on server and resets state
  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn("Logout request completed with notice:", err);
    } finally {
      setUser(null);
      setUserName("");
      setWorkspaceRole(null);
      setIsAuthenticated(false);
    }
  };

  // 4. Update Profile: Sync display name in state
  const updateUser = (updates: { displayName?: string; workspaceRole?: WorkspaceRole }) => {
    if (updates.displayName !== undefined) {
      setUserName(updates.displayName);
      setUser((prev) => (prev ? { ...prev, displayName: updates.displayName! } : { displayName: updates.displayName! }));
    }
    if (updates.workspaceRole !== undefined) {
      setWorkspaceRole(updates.workspaceRole);
    }
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
