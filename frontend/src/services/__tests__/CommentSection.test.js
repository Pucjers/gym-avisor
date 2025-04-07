import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommentSection from '../../components/comments/CommentSection';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

jest.mock('../../contexts/AuthContext');
jest.mock('firebase/firestore');

describe('CommentSection Component', () => {
  const mockComments = [
    {
      id: 'comment1',
      content: 'This is a test comment',
      author: 'user1@example.com',
      authorName: 'User One',
      createdAt: { toDate: () => new Date('2023-01-01T10:00:00') }
    },
    {
      id: 'comment2',
      content: 'Another test comment',
      author: 'user2@example.com',
      authorName: 'User Two',
      createdAt: { toDate: () => new Date('2023-01-02T10:00:00') }
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firestore
    collection.mockReturnValue('commentsCollection');
    query.mockReturnValue('commentsQuery');
    where.mockReturnValue('whereQuery');
    orderBy.mockReturnValue('orderByQuery');
    
    // Mock onSnapshot to return comments
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: mockComments.map(comment => ({
          id: comment.id,
          data: () => comment
        }))
      });
      return jest.fn(); // Unsubscribe function
    });
    
    // Mock addDoc
    addDoc.mockResolvedValue({ id: 'new-comment-id' });
  });
  
  test('should render comments when available', async () => {
    // Mock auth context
    useAuth.mockReturnValue({
      currentUser: { uid: 'user-id', email: 'test@example.com' }
    });
    
    render(<CommentSection postId="test-post-id" />);
    
    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      expect(screen.getByText('Another test comment')).toBeInTheDocument();
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();
    });
  });
  
  test('should render comment form for authenticated users', async () => {
    // Mock auth context
    useAuth.mockReturnValue({
      currentUser: { uid: 'user-id', email: 'test@example.com' }
    });
    
    render(<CommentSection postId="test-post-id" />);
    
    // Comment form should be rendered
    expect(screen.getByPlaceholderText(/додайте коментар/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /коментувати/i })).toBeInTheDocument();
  });
  
  test('should not render comment form for non-authenticated users', async () => {
    // Mock auth context - not logged in
    useAuth.mockReturnValue({
      currentUser: null
    });
    
    render(<CommentSection postId="test-post-id" />);
    
    // Comment form should not be rendered
    expect(screen.queryByPlaceholderText(/додайте коментар/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /коментувати/i })).not.toBeInTheDocument();
    
    // Should show login message
    expect(screen.getByText(/увійдіть, щоб залишити коментар/i)).toBeInTheDocument();
  });
  
  test('should handle adding a new comment', async () => {
    // Mock auth context
    useAuth.mockReturnValue({
      currentUser: { 
        uid: 'user-id', 
        email: 'test@example.com',
        displayName: 'Test User'
      }
    });
    
    render(<CommentSection postId="test-post-id" />);
    
    // Type a comment
    fireEvent.change(screen.getByPlaceholderText(/додайте коментар/i), {
      target: { value: 'This is a new comment' }
    });
    
    // Submit the comment
    fireEvent.click(screen.getByRole('button', { name: /коментувати/i }));
    
    // Check if addDoc was called with correct data
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        'commentsCollection',
        expect.objectContaining({
          postId: 'test-post-id',
          content: 'This is a new comment',
          author: 'test@example.com',
          authorId: 'user-id',
          authorName: 'Test User'
        })
      );
    });
  });
  
  test('should validate comment before submission', async () => {
    // Mock auth context
    useAuth.mockReturnValue({
      currentUser: { uid: 'user-id', email: 'test@example.com' }
    });
    
    render(<CommentSection postId="test-post-id" />);
    
    // Submit button should be disabled initially (empty comment)
    expect(screen.getByRole('button', { name: /коментувати/i })).toBeDisabled();
    
    // Type a comment
    fireEvent.change(screen.getByPlaceholderText(/додайте коментар/i), {
      target: { value: 'This is a new comment' }
    });
    
    // Submit button should be enabled
    expect(screen.getByRole('button', { name: /коментувати/i })).not.toBeDisabled();
    
    // Clear the comment
    fireEvent.change(screen.getByPlaceholderText(/додайте коментар/i), {
      target: { value: '' }
    });
    
    // Submit button should be disabled again
    expect(screen.getByRole('button', { name: /коментувати/i })).toBeDisabled();
  });
  
  test('should handle empty comments list', async () => {
    // Mock empty comments list
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: [] });
      return jest.fn(); // Unsubscribe function
    });
    
    // Mock auth context
    useAuth.mockReturnValue({
      currentUser: { uid: 'user-id', email: 'test@example.com' }
    });
    
    render(<CommentSection postId="test-post-id" />);
    
    // Empty state message should be shown
    await waitFor(() => {
      expect(screen.getByText(/коментарів поки немає/i)).toBeInTheDocument();
    });
  });
});
