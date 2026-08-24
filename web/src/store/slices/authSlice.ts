import{ createSlice, type PayloadAction } from "@reduxjs/toolkit";
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userName: string;
  isInitializing: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  userName: "",
  isInitializing: true,
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

setUser:(state ,action :PayloadAction<{
  userName : string;
}>)=>{
    state.isAuthenticated = true;
      state.userName = action.payload.userName;
},
finishAuthCheck: (state) => {
  state.isInitializing = false;
},

     logout: (state) => {
      state.isAuthenticated = false;
      state.userName = "";
      state.token = null;
    },

  
  },
});

export const { login, logout,setUser,finishAuthCheck } = authSlice.actions;

export default authSlice.reducer;