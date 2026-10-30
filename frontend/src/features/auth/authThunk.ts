import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/apiClient";

export const loginUser = createAsyncThunk(
    "auth/login",
    async (credentials: {email: string, password: string}, { rejectWithValue }) => {
        try {
            const response = await api.post("/auth/login", credentials);
            return response.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data);
        }
    }
)

export const registerUser = createAsyncThunk(
    "auth/register",
    async (userData: {name: string, email: string, password: string}, { rejectWithValue }) => {
        try {
            const response = await api.post("/auth/register", userData);
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data);
        }
    }
)

export const refreshToken = createAsyncThunk(
    "auth/refresh",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.post("/auth/refresh-token");
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data);
        }
    }
)

export const checkAuthStatus = createAsyncThunk(
    "auth/check",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/auth/current-user");
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data);
        }
    }
)

export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.post("/auth/logout");
            localStorage.clear();
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data);
        }
    }
)

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (token: string, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/verify-user-email", { token });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Verification failed");
    }
  }
);