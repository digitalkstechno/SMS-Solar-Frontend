import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import authReducer from './slices/authSlice';
import categoryReducer from './slices/categorySlice';
import productReducer from './slices/productSlice';
import leadStatusReducer from './slices/leadStatusSlice';
import leadLabelReducer from './slices/leadLabelSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    category: categoryReducer,
    product: productReducer,
    leadStatus: leadStatusReducer,
    leadLabel: leadLabelReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
