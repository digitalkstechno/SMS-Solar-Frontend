import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';

export interface LeadStatusItem {
  _id: string;
  name: string;
  color?: string;
  createdAt?: string;
}

export interface LeadStatusState {
  data: LeadStatusItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: LeadStatusState = {
  data: [],
  status: 'idle',
  error: null,
};

export const fetchLeadStatuses = createAsyncThunk(
  'leadStatus/fetchLeadStatuses',
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.get(baseUrl.leadStatuses, { headers, params: { limit: 1000 } });
      return (response.data?.data || response.data || []) as LeadStatusItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const leadStatusSlice = createSlice({
  name: 'leadStatus',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeadStatuses.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLeadStatuses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchLeadStatuses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export default leadStatusSlice.reducer;
