import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { getMe } from "../features/auth/api/authApi";
import { setUser, finishAuthCheck } from "../store/slices/authSlice";

const AuthInitializer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        dispatch(finishAuthCheck());
        return;
      }

      try {
        const response = await getMe();

        const user = response.data.user;
        const workspaceRole = response.data.workspaceRole;

        dispatch(
          setUser({
            userName: user.displayName,
            workspaceRole: workspaceRole,
          }),
        );
      } catch (error) {
        console.log("Authentication failed");

        localStorage.removeItem("token");
      } finally {
        dispatch(finishAuthCheck());
      }
    };

    checkAuthentication();
  }, [dispatch]);

  return null;
};

export default AuthInitializer;
