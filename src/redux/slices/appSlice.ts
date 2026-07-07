import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppState {
  isSidebarOpen: boolean;
  globalLoading: boolean;
}

const initialState: AppState = {
  isSidebarOpen: false,
  globalLoading: false,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
      if (typeof window !== 'undefined') localStorage.setItem('isSidebarOpen', String(state.isSidebarOpen));
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
      if (typeof window !== 'undefined') localStorage.setItem('isSidebarOpen', String(action.payload));
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setGlobalLoading } = appSlice.actions;

export default appSlice.reducer;
