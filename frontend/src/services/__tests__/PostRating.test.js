// src/services/__tests__/PostRating.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostRating from '../../components/posts/PostRating';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, onSnapshot } from 'firebase/firestore';

// Mock the Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(item => item),
  arrayRemove: jest.fn(item => item),
  setDoc: jest.fn(),
  onSnapshot: jest.fn((ref, callback) => {
    // Mock data that will be returned by onSnapshot
    const mockData = {
      averageRating: 4.5,
      totalRatings: 10,
      likes: ['user1', 'user2'],
      ratings: [
        { userId: 'user1', rating: 5 },
        { userId: 'user2', rating: 4 }
      ]
    };
    
    // Call the callback with mock snapshot
    callback({
      exists: () => true,
      data: () => mockData,
    });
    
    // Return unsubscribe function
    return jest.fn();
  }),
}));

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('PostRating Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock implementation for doc function
    doc.mockImplementation(() => ({ id: 'test-post-id' }));
    
    // Set up default authenticated user
    useAuth.mockImplementation(() => ({
      currentUser: { uid: 'user3', email: 'test@example.com' },
      userLoggedIn: true
    }));
  });
  
  test('should render rating component with data', async () => {
    render(<PostRating postId="test-post-id" />);
    
    // Wait for data to load
    await waitFor(() => {
      // Verify the rating component renders correctly
      expect(screen.getByText(/4.5/)).toBeInTheDocument();
      expect(screen.getByText(/10 оцінок/)).toBeInTheDocument();
      expect(screen.getByText(/2 вподобань/)).toBeInTheDocument();
    });
  });
  
  test('should show login message for unauthenticated users', async () => {
    // Change to unauthenticated user
    useAuth.mockImplementation(() => ({
      currentUser: null,
      userLoggedIn: false
    }));
    
    render(<PostRating postId="test-post-id" />);
    
    await waitFor(() => {
      // Verify that elements are disabled when user is not logged in
      const likeButton = screen.getByLabelText(/Увійдіть, щоб оцінити/i);
      expect(likeButton.closest('button')).toBeDisabled();
    });
  });
  
  test('should handle like toggle', async () => {
    // Setup mock for updateDoc
    updateDoc.mockResolvedValue({});
    
    render(<PostRating postId="test-post-id" />);
    
    await waitFor(() => {
      // Find the like button
      const likeButton = screen.getByLabelText(/Подобається/i);
      expect(likeButton).toBeInTheDocument();
    });
    
    // Click the like button
    const likeButton = screen.getByLabelText(/Подобається/i);
    fireEvent.click(likeButton);
    
    // Verify the updateDoc function was called with correct parameters
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          likes: expect.anything(),
          lastUpdated: expect.anything()
        })
      );
    });
  });
  
  test('should handle star rating', async () => {
    // Setup mock for updateDoc
    updateDoc.mockResolvedValue({});
    
    render(<PostRating postId="test-post-id" />);
    
    await waitFor(() => {
      // Make sure rating component is displayed
      expect(screen.getByText(/Оцініть статтю/i)).toBeInTheDocument();
    });
    
    // Find rating inputs and simulate setting a rating of 5
    const inputs = screen.getAllByRole('radio', { name: /post-rating/i });
    const fiveStarInput = inputs.find(input => input.value === '5');
    
    if (fiveStarInput) {
      fireEvent.click(fiveStarInput);
    } else {
      // Alternative approach when Material UI doesn't expose radio inputs properly
      const ratingContainer = screen.getByText(/Оцініть статтю/i).closest('div');
      const stars = ratingContainer.querySelectorAll('input[type="radio"]');
      if (stars.length > 0) {
        fireEvent.click(stars[stars.length - 1]); // Click the last star (5)
      }
    }
    
    // Verify the updateDoc function was called
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });
  
  test('should create new ratings document if it does not exist', async () => {
    // Change onSnapshot to return empty document first time
    onSnapshot.mockImplementationOnce((ref, callback) => {
      callback({
        exists: () => false,
        data: () => null
      });
      return jest.fn();
    });
    
    // Setup mock for setDoc
    setDoc.mockResolvedValue({});
    
    render(<PostRating postId="test-post-id" />);
    
    await waitFor(() => {
      expect(screen.getByText(/0 вподобань/i)).toBeInTheDocument();
    });
    
    // Try to rate the post
    const ratingContainer = screen.getByText(/Оцініть статтю/i).closest('div');
    const stars = ratingContainer.querySelectorAll('input[type="radio"]');
    if (stars.length > 0) {
      fireEvent.click(stars[4]); // Click the 5th star
    }
    
    // Verify setDoc was called to create a new document
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ratings: expect.arrayContaining([
            expect.objectContaining({
              userId: 'user3',
              rating: expect.any(Number)
            })
          ]),
          averageRating: expect.any(Number),
          totalRatings: 1
        })
      );
    });
  });
});