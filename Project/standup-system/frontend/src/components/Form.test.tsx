import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Form } from './Form';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { standupApi } from '../services/api';

const mockStore = configureStore({
  reducer: {
    [standupApi.reducerPath]: standupApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(standupApi.middleware),
});

describe('Form Component', () => {
  it('renders correctly with default state', async () => {
    render(
      <Provider store={mockStore}>
        <Form />
      </Provider>
    );

    expect(screen.getByText('Daily Standup')).toBeInTheDocument();
    expect(screen.getByText('Select Your Name')).toBeInTheDocument();
    expect(screen.getByText('What did you complete yesterday?')).toBeInTheDocument();
    expect(screen.getByText('What are you planning to work on today?')).toBeInTheDocument();
    expect(screen.getByText('Any blockers or impediments?')).toBeInTheDocument();
  });
});
