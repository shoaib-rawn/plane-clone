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
    workspaceRole: "ADMIN" | "MEMBER";
    user: {
      displayName: string;
    };
  };
}