import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../api/authApi";
import { useDispatch } from "react-redux";
import { login } from "../../../store/slices/authSlice";
import type { LoginPayload } from "../types/typesAuth";


export const useLogin = () => {
     const dispatch = useDispatch();
    return useMutation({
                mutationFn: (userData: LoginPayload) =>
                  loginUser(userData),
            
                onSuccess: (data) => {
                const token = data.data.token;
                  const userName = data.data.user.displayName;
                  const workspaceRole = data.data.workspaceRole;
            
                  localStorage.setItem("token", token);
            
                  dispatch(
                    login({
                      token,
                      userName,
                      workspaceRole,
                    }),
                  );
                },
            
                 onError: (error) => {
      console.error("Login failed:", error);
    },
              });
    
}


