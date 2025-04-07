import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: {
    PROVIDER_ID: 'google.com'
  }
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn()
}));

// Test component to access auth context
const TestComponent = () => {
  const { 
    userLoggedIn, 
    currentUser, 
    isAdmin,
    loading 
  } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <div data-testid="logged-in">{userLoggedIn ? 'Logged In' : 'Logged Out'}</div>
      <div data-testid="is-admin">{isAdmin ? 'Admin' : 'Not Admin'}</div>
      <div data-testid="user-email">{currentUser?.email || 'No User'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should show loading state initially', () => {
    // Mock auth state, but don't resolve yet
    onAuthStateChanged.mockImplementation(() => {
      return () => {}; // Return unsubscribe function
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should handle logged out state', async () => {
    // Mock auth state with no user
    onAuthStateChanged.mockImplementation(auth, callback => {
      // Call the callback with null for logged out
      callback(null);
      return () => {}; // Return unsubscribe function
    });
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    expect(screen.getByTestId('logged-in')).toHaveTextContent('Logged Out');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('Not Admin');
    expect(screen.getByTestId('user-email')).toHaveTextContent('No User');
  });

  test('should handle logged in state with regular user', async () => {
    // Mock user data
    const mockUser = {
      uid: '123',
      email: 'user@example.com',
      providerData: [{ providerId: 'password' }]
    };
    
    // Mock user profile data
    const mockUserProfile = {
      uid: '123',
      email: 'user@example.com',
      role: 'user',
      displayName: 'Test User'
    };
    
    // Mock auth state with user
    onAuthStateChanged.mockImplementation((auth, callback) => {
      // Call the callback with mock user for logged in
      callback(mockUser);
      return () => {}; // Return unsubscribe function
    });
    
    // Mock Firestore getDoc
    const mockDocSnapshot = {
      exists: jest.fn().mockReturnValue(true),
      data: jest.fn().mockReturnValue(mockUserProfile)
    };
    
    doc.mockReturnValue('userDocRef');
    getDoc.mockResolvedValue(mockDocSnapshot);
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    expect(screen.getByTestId('logged-in')).toHaveTextContent('Logged In');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('Not Admin');
    expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com');
  });

  test('should handle logged in state with admin user', async () => {
    // Mock user data
    const mockUser = {
      uid: '456',
      email: 'admin@example.com',
      providerData: [{ providerId: 'password' }]
    };
    
    // Mock user profile data with admin role
    const mockUserProfile = {
      uid: '456',
      email: 'admin@example.com',
      role: 'admin',
      displayName: 'Admin User'
    };
    
    // Mock auth state with user
    onAuthStateChanged.mockImplementation((auth, callback) => {
      // Call the callback with mock user for logged in
      callback(mockUser);
      return () => {}; // Return unsubscribe function
    });
    
    // Mock Firestore getDoc
    const mockDocSnapshot = {
      exists: jest.fn().mockReturnValue(true),
      data: jest.fn().mockReturnValue(mockUserProfile)
    };
    
    doc.mockReturnValue('userDocRef');
    getDoc.mockResolvedValue(mockDocSnapshot);
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    expect(screen.getByTestId('logged-in')).toHaveTextContent('Logged In');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('Admin');
    expect(screen.getByTestId('user-email')).toHaveTextContent('admin@example.com');
  });

  test('should create new user profile if it does not exist', async () => {
    // Mock user data
    const mockUser = {
      uid: '789',
      email: 'new@example.com',
      providerData: [{ providerId: 'google.com' }]
    };
    
    // Mock auth state with user
    onAuthStateChanged.mockImplementation((auth, callback) => {
      // Call the callback with mock user for logged in
      callback(mockUser);
      return () => {}; // Return unsubscribe function
    });
    
    // Mock Firestore getDoc - user does not exist
    const mockDocSnapshot = {
      exists: jest.fn().mockReturnValue(false)
    };
    
    // Mock auth.currentUser for the fetchUserProfile function
    Object.defineProperty(auth, 'currentUser', {
      value: mockUser,
      writable: true
    });
    
    doc.mockReturnValue('userDocRef');
    getDoc.mockResolvedValue(mockDocSnapshot);
    setDoc.mockResolvedValue();
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    // Verify setDoc was called to create new profile
    expect(setDoc).toHaveBeenCalledWith('userDocRef', expect.objectContaining({
      uid: '789',
      email: 'new@example.com',
      role: 'user'
    }));
    
    expect(screen.getByTestId('logged-in')).toHaveTextContent('Logged In');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('Not Admin');
    expect(screen.getByTestId('user-email')).toHaveTextContent('new@example.com');
  });
});