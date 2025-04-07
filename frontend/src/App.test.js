// src/App.test.js
import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useRoutes: () => <div data-testid="routes">Routes Content</div>,
}));

jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    currentUser: null,
    userLoggedIn: false,
    loading: false,
  }),
}));

// Simple test to verify app renders
test('renders app without crashing', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
  
  const routesElement = screen.getByTestId('routes');
  expect(routesElement).toBeInTheDocument();
});