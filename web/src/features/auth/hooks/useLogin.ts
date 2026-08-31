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

      // Seed the currentUser cache immediately for instant transition
      queryClient.setQueryData(["currentUser"], {
        data: {
          user: data.data.user,
          workspaceRole: data.data.workspaceRole,
        },
      });

      login({
        displayName: userName,
        workspaceRole: workspaceRole,
      });

      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });
};
