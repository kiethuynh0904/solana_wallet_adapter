import { User } from "./../api/auth";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  user: User;
}

const initialState: AuthState = {
  user: {
    id: "",
    name: "",
    avatar: "",
  },
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    saveUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = {
        id: "",
        name: "",
        avatar: "",
      };
    },
  },
});

// Action creators are generated for each case reducer function
export const { saveUser, clearUser } = authSlice.actions;

export default authSlice.reducer;
