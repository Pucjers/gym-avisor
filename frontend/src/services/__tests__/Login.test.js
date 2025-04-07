import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../components/auth/Login';
import { useAuth } from '../../contexts/AuthContext';
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from '../../services/auth';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/auth');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(() => <div data-testid="navigate" />)
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render login form when user is not logged in', () => {
    // Mock auth context
    useAuth.mockReturnValue({
      userLoggedIn: false
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Check if form elements are rendered
    expect(screen.getByLabelText(/електронна пошта/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /увійти/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /увійти через google/i })).toBeInTheDocument();
  });

  test('should redirect when user is already logged in', () => {
    // Mock auth context
    useAuth.mockReturnValue({
      userLoggedIn: true
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Check if Navigate component is rendered
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
  });

  test('should handle email/password login', async () => {
    // Mock auth context
    useAuth.mockReturnValue({
      userLoggedIn: false
    });

    // Mock auth service
    doSignInWithEmailAndPassword.mockResolvedValue({
      user: { uid: '123', email: 'test@example.com' },
      error: null
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Fill the form
    fireEvent.change(screen.getByLabelText(/електронна пошта/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/пароль/i), {
      target: { value: 'password123' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /увійти/i }));

    // Check if auth service was called
    await waitFor(() => {
      expect(doSignInWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });
  });

  test('should display error message on login failure', async () => {
    // Mock auth context
    useAuth.mockReturnValue({
      userLoggedIn: false
    });

    // Mock auth service with error
    doSignInWithEmailAndPassword.mockResolvedValue({
      user: null,
      error: 'Невірний пароль'
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Fill the form
    fireEvent.change(screen.getByLabelText(/електронна пошта/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/пароль/i), {
      target: { value: 'wrong-password' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /увійти/i }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Невірний пароль')).toBeInTheDocument();
    });
  });

  test('should handle Google login', async () => {
    // Mock auth context
    useAuth.mockReturnValue({
      userLoggedIn: false
    });

    // Mock auth service
    doSignInWithGoogle.mockResolvedValue({
      user: { uid: '123', email: 'test@gmail.com' },
      error: null
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Click Google login button
    fireEvent.click(screen.getByRole('button', { name: /увійти через google/i }));

    // Check if auth service was called
    await waitFor(() => {
      expect(doSignInWithGoogle).toHaveBeenCalled();
    });
  });

  test('should toggle password visibility', () => {
    // Mock auth context
    useAuth.mockReturnValue({
      userLoggedIn: false
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Initially password field should be of type password (hidden)
    expect(screen.getByLabelText(/пароль/i)).toHaveAttribute('type', 'password');

    // Click visibility toggle button
    fireEvent.click(screen.getByRole('button', { name: /toggle password/i }));

    // Password should now be visible (type text)
    expect(screen.getByLabelText(/пароль/i)).toHaveAttribute('type', 'text');

    // Click again to hide
    fireEvent.click(screen.getByRole('button', { name: /toggle password/i }));

    // Password should be hidden again
    expect(screen.getByLabelText(/пароль/i)).toHaveAttribute('type', 'password');
  });
});