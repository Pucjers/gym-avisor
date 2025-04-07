  
  import React from 'react';
  import { render, screen, fireEvent, waitFor } from '@testing-library/react';
  import PostRating from '../../components/posts/PostRating';
  import { useAuth } from '../../contexts/AuthContext';
  import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, onSnapshot } from 'firebase/firestore';
  
  jest.mock('../../contexts/AuthContext');
  jest.mock('firebase/firestore');
  
  describe('PostRating Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Mock Firestore
      doc.mockReturnValue('ratingsRef');
      
      // Mock onSnapshot for real-time updates
      onSnapshot.mockImplementation((docRef, callback) => {
        // Simulate an initial state for ratings
        callback({
          exists: () => true,
          data: () => ({
            averageRating: 4.5,
            totalRatings: 10,
            likes: ['user1', 'user2'],
            ratings: [
              { userId: 'user1', rating: 5 },
              { userId: 'user2', rating: 4 }
            ]
          })
        });
        return jest.fn(); // Unsubscribe function
      });
    });
    
    test('should render rating component with data', async () => {
      // Mock auth context
      useAuth.mockReturnValue({
        currentUser: { uid: 'user3', email: 'test@example.com' }
      });
      
      render(<PostRating postId="test-post-id" />);
      
      // Wait for ratings data to load
      await waitFor(() => {
        // Average rating should be displayed
        expect(screen.getByText(/4.5/)).toBeInTheDocument();
        // Number of ratings should be displayed
        expect(screen.getByText(/10/)).toBeInTheDocument();
        // Number of likes should be displayed
        expect(screen.getByText(/2 вподобань/i)).toBeInTheDocument();
        
        // Rating stars should be rendered
        expect(screen.getByRole('slider', { name: /post-rating/i })).toBeInTheDocument();
      });
    });
    
    test('should show login message for unauthenticated users', async () => {
      // Mock auth context - not logged in
      useAuth.mockReturnValue({
        currentUser: null
      });
      
      render(<PostRating postId="test-post-id" />);
      
      // Tooltips should indicate login requirement
      const likeButton = screen.getByRole('button');
      fireEvent.mouseOver(likeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/увійдіть, щоб оцінити/i)).toBeInTheDocument();
      });
      
      // Rating should be disabled
      expect(screen.getByRole('slider', { name: /post-rating/i })).toBeDisabled();
    });
    
    test('should handle like toggle', async () => {
      // Mock auth context
      useAuth.mockReturnValue({
        currentUser: { uid: 'user3', email: 'test@example.com' }
      });
      
      // Mock getDoc for checking if document exists
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          likes: ['user1', 'user2'],
          averageRating: 4.5,
          totalRatings: 10
        })
      });
      
      // Mock updateDoc
      updateDoc.mockResolvedValue();
      
      render(<PostRating postId="test-post-id" />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(/2 вподобань/i)).toBeInTheDocument();
      });
      
      // Click like button
      fireEvent.click(screen.getByRole('button'));
      
      // Check if updateDoc was called with arrayUnion
      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalledWith(
          'ratingsRef',
          expect.objectContaining({
            likes: arrayUnion('user3'),
            lastUpdated: expect.any(Date)
          })
        );
      });
      
      // Reset mocks for next test
      jest.clearAllMocks();
      
      // Change onSnapshot to simulate the user has liked the post
      onSnapshot.mockImplementation((docRef, callback) => {
        callback({
          exists: () => true,
          data: () => ({
            averageRating: 4.5,
            totalRatings: 10,
            likes: ['user1', 'user2', 'user3'],
            ratings: [
              { userId: 'user1', rating: 5 },
              { userId: 'user2', rating: 4 }
            ]
          })
        });
        return jest.fn();
      });
      
      // Re-render with updated state
      render(<PostRating postId="test-post-id" />);
      
      // Wait for component to load with updated state
      await waitFor(() => {
        expect(screen.getByText(/3 вподобань/i)).toBeInTheDocument();
      });
      
      // Click like button again to unlike
      fireEvent.click(screen.getByRole('button'));
      
      // Check if updateDoc was called with arrayRemove
      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalledWith(
          'ratingsRef',
          expect.objectContaining({
            likes: arrayRemove('user3'),
            lastUpdated: expect.any(Date)
          })
        );
      });
    });
    
    test('should handle star rating', async () => {
      // Mock auth context
      useAuth.mockReturnValue({
        currentUser: { uid: 'user3', email: 'test@example.com' }
      });
      
      // Mock getDoc for checking if document exists
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          likes: ['user1', 'user2'],
          averageRating: 4.5,
          totalRatings: 10,
          ratings: [
            { userId: 'user1', rating: 5 },
            { userId: 'user2', rating: 4 }
          ]
        })
      });
      
      // Mock updateDoc
      updateDoc.mockResolvedValue();
      
      render(<PostRating postId="test-post-id" />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByRole('slider', { name: /post-rating/i })).toBeInTheDocument();
      });
      
      // Click the 5-star rating
      const stars = screen.getAllByRole('radio');
      fireEvent.click(stars[4]); // 5th star
      
      // Check if updateDoc was called with updated ratings
      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalledWith(
          'ratingsRef',
          expect.objectContaining({
            ratings: expect.arrayContaining([
              expect.objectContaining({
                userId: 'user3',
                rating: 5
              })
            ]),
            averageRating: expect.any(Number),
            totalRatings: 11, // Increased by 1
            lastUpdated: expect.any(Date)
          })
        );
      });
    });
    
    test('should create new ratings document if it does not exist', async () => {
      // Mock auth context
      useAuth.mockReturnValue({
        currentUser: { uid: 'user1', email: 'test@example.com' }
      });
      
      // Mock getDoc to return non-existent document
      getDoc.mockResolvedValue({
        exists: () => false
      });
      
      // Mock setDoc for creating new document
      setDoc.mockResolvedValue();
      
      // Mock onSnapshot for initial empty state
      onSnapshot.mockImplementation((docRef, callback) => {
        callback({
          exists: () => false
        });
        return jest.fn();
      });
      
      render(<PostRating postId="test-post-id" />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByRole('slider', { name: /post-rating/i })).toBeInTheDocument();
      });
      
      // Click the 4-star rating
      const stars = screen.getAllByRole('radio');
      fireEvent.click(stars[3]); // 4th star
      
      // Check if setDoc was called to create a new ratings document
      await waitFor(() => {
        expect(setDoc).toHaveBeenCalledWith(
          'ratingsRef',
          expect.objectContaining({
            ratings: [
              expect.objectContaining({
                userId: 'user1',
                rating: 4
              })
            ],
            averageRating: 4,
            totalRatings: 1,
            likes: [],
            lastUpdated: expect.any(Date)
          })
        );
      });
    });
  });