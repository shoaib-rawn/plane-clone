import{ createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userName : string;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  userName:"",
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
  }>
) => {
  state.isAuthenticated = true;
  state.token = action.payload.token;
  state.userName = action.payload.userName;
},

     logout: (state) => {
      state.isAuthenticated = false;
      state.userName = "";
      state.token = null;
    },
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;