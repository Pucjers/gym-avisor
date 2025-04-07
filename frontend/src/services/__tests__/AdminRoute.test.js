import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminRoute from '../../components/auth/AdminRoute';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(() => <div data-testid="navigate-to-login" />),
  Link: jest.fn(({ to, children }) => <a href={to} data-testid="link">{children}</a>)
}));

describe('AdminRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should show loading while checking auth status', () => {
    // Mock auth context with loading state
    useAuth.mockReturnValue({
      userLoggedIn: true,
      isAdmin: false,
      loading: true
    });

    render(
      <BrowserRouter>
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      </BrowserRouter>
    );

    expect(screen.getByText(/перевірка прав доступу/i)).toBeInTheDocument();
  });

  test('should navigate to login when user is not logged in', () => {
    // Mock auth context with logged out user
    useAuth.mockReturnValue({
      userLoggedIn: false,
      isAdmin: false,
      loading: false
    });

    render(
      <BrowserRouter>
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      </BrowserRouter>
    );

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('navigate-to-login')).toBeInTheDocument();
  });

  test('should show access denied message when user is not an admin', () => {
    // Mock auth context with regular user
    useAuth.mockReturnValue({
      userLoggedIn: true,
      isAdmin: false,
      loading: false
    });

    render(
      <BrowserRouter>
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      </BrowserRouter>
    );

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    expect(screen.getByText(/доступ заборонено/i)).toBeInTheDocument();
    expect(screen.getByText(/немає прав доступу/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /повернутися на головну/i })).toBeInTheDocument();
  });

  test('should render children when user is an admin', () => {
    // Mock auth context with admin user
    useAuth.mockReturnValue({
      userLoggedIn: true,
      isAdmin: true,
      loading: false
    });

    render(
      <BrowserRouter>
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
  });
});