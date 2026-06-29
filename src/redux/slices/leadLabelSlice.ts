import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';

export interface LeadLabelItem {
  _id: string;
  name: string;
  color?: string;
  createdAt?: string;
}

export interface LeadLabelState {
  data: LeadLabelItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: LeadLabelState = {
  data: [],
  status: 'idle',
  error: null,
};

export const fetchLeadLabels = createAsyncThunk(
  'leadLabel/fetchLeadLabels',
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.get(baseUrl.leadLabels, { headers, params: { limit: 1000 } });
      return (response.data?.data || response.data || []) as LeadLabelItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const leadLabelSlice = createSlice({
  name: 'leadLabel',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeadLabels.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLeadLabels.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchLeadLabels.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export default leadLabelSlice.reducer;
