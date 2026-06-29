import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email?: string;
  role?: string;
}

export interface AuthState {
  currentStaff: User | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  currentStaff: null,
  status: 'idle',
  error: null,
};

export const fetchCurrentStaff = createAsyncThunk(
  'auth/fetchCurrentStaff',
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue('No token found');
      
      const response = await axios.get(baseUrl.currentStaff, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.data || response.data; 
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearCurrentStaff: (state) => {
      state.currentStaff = null;
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentStaff.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCurrentStaff.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentStaff = action.payload;
      })
      .addCase(fetchCurrentStaff.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentStaff } = authSlice.actions;

export default authSlice.reducer;
