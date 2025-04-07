import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(() => <div data-testid="navigate-to-login" />)
}));

describe('ProtectedRoute Component', () => {
  test('should render children when user is logged in', () => {
    // Mock auth context with logged in user
    useAuth.mockReturnValue({
      userLoggedIn: true
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate-to-login')).not.toBeInTheDocument();
  });

  test('should navigate to login when user is not logged in', () => {
    // Mock auth context with logged out user
    useAuth.mockReturnValue({
      userLoggedIn: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('navigate-to-login')).toBeInTheDocument();
  });
});