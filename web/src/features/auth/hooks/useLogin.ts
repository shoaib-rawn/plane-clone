import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginUser } from "../api/authApi";
import { useAuth } from "../../../context/AuthContext";
import type { LoginPayload } from "../types/typesAuth";

export const useLogin = () => {
  const { login } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: LoginPayload) => loginUser(userData),
    onSuccess: (data) => {
      const userName = data.data.user.displayName;
      const workspaceRole = data.data.workspaceRole;

      // Seed the currentUser cache immediately so /me is not called again
      queryClient.setQueryData(
        ["currentUser"],
        {
          data: {
            user: data.data.user,
            workspaceRole: data.data.workspaceRole,
          },
        },
        { updatedAt: Date.now() }
      );

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
