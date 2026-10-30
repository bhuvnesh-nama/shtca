import { createSlice,  } from "@reduxjs/toolkit";
import type { PayloadAction} from "@reduxjs/toolkit";
import type { AuthState, User } from "./types";
import { loginUser,checkAuthStatus, verifyEmail } from "./authThunk";

const initialState:AuthState = {
    user: null,
    token: null,
    isLoggedIn: false,
    isEmailVerified: false,
    loading: false,
    error: null
}
    
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
            state.isLoggedIn = !!action.payload;
            state.isEmailVerified = action.payload?.isEmailVerified ?? false;
        },
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isLoggedIn = false;
            state.isEmailVerified = false;
            state.error = null;
        },
    },
    extraReducers: (builder)=> {
        builder
            .addCase(loginUser.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isEmailVerified = action.payload.user.isEmailVerified;
                state.isLoggedIn = true;
                state.loading = false;
                state.error = null;
            })
            .addCase(loginUser.pending, (_) => {
                // state.loading = true;
            })
            .addCase(loginUser.rejected, (state:any, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(checkAuthStatus.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                state.user = action.payload.data;
                state.isEmailVerified = action.payload.data.isEmailVerified;
                state.isLoggedIn = true;
                state.loading = false;
                state.error = null;
            })
            .addCase(checkAuthStatus.rejected, (state) => {
                state.user = null;
                state.token = null;
                state.isLoggedIn = false;
                state.loading = false;
            })
            .addCase(verifyEmail.pending, (state) => {
                state.loading = true;
            })
            .addCase(verifyEmail.fulfilled, (state, _) => {
                state.loading = false;
                state.isEmailVerified = true;
                if (state.user) {
                    state.user.isEmailVerified = true;
                }
            })
            .addCase(verifyEmail.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { setUser, setToken, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;