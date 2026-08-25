import { useMutation } from "@tanstack/react-query";
import { registerUser } from "../api/authApi";
import type { RegisterPayload } from "../types/typesAuth";

export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: RegisterPayload)=>{
     
      return registerUser(userData);
    },
  });
};