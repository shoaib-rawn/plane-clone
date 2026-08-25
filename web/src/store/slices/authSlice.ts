import{ createSlice, type PayloadAction } from "@reduxjs/toolkit";
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userName: string;
  isInitializing: boolean;
  workspaceRole: "ADMIN" | "MEMBER" | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  userName: "",
  isInitializing: true,
  workspaceRole: null,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
   login: (
  state,
  action: PayloadAction<{
    token: string;
    userName: string;
    workspaceRole: "ADMIN" | "MEMBER";
  }>
) => {
  state.isAuthenticated = true;
  state.token = action.payload.token;
  state.userName = action.payload.userName;
  state.workspaceRole = action.payload.workspaceRole;
},

setUser:(state ,action :PayloadAction<{
  userName : string;
  workspaceRole: "ADMIN" | "MEMBER";
}>)=>{
    state.isAuthenticated = true;
      state.userName = action.payload.userName;
      state.workspaceRole = action.payload.workspaceRole;
},
finishAuthCheck: (state) => {
  state.isInitializing = false;
},

     logout: (state) => {
      state.isAuthenticated = false;
      state.userName = "";
      state.token = null;
      state.workspaceRole = null;
    },

  
  },
});

export const { login, logout,setUser,finishAuthCheck } = authSlice.actions;

export default authSlice.reducer;