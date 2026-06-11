import { configureStore } from '@reduxjs/toolkit';
import { standupApi } from '../services/api';

export const store = configureStore({
  reducer: {
    [standupApi.reducerPath]: standupApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(standupApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
