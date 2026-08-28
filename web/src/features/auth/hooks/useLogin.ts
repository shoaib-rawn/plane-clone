import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../api/authApi";
import { useAuth } from "../../../context/AuthContext";
import type { LoginPayload } from "../types/typesAuth";

export const useLogin = () => {
  const { login } = useAuth();

  return useMutation({
    mutationFn: (userData: LoginPayload) => loginUser(userData),
    onSuccess: (data) => {
      const userName = data.data.user.displayName;
      const workspaceRole = data.data.workspaceRole;

      login({
        displayName: userName,
        workspaceRole: workspaceRole,
      });
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });
};
