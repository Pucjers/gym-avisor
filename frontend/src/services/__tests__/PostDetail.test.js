import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostDetail from '../../components/posts/PostDetail';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

jest.mock('../../contexts/AuthContext');
jest.mock('firebase/firestore');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'test-post-id' }),
  useNavigate: () => jest.fn()
}));
jest.mock('../../components/comments/CommentSection', () => () => (
  <div data-testid="comment-section">Comment Section Mock</div>
));
jest.mock('../../components/posts/PostRating', () => ({ postId }) => (
  <div data-testid="post-rating">Post Rating Mock for {postId}</div>
));

describe('PostDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const mockPost = {
    id: 'test-post-id',
    title: 'Test Post Title',
    content: '<p>Test post content</p>',
    author: 'test@example.com',
    createdAt: { toDate: () => new Date('2023-01-01') },
    fileName: 'test-document.docx',
    fileUrl: 'https://example.com/test-document.docx'
  };
  
  test('should show loading state initially', () => {
    // Mock Firestore
    doc.mockReturnValue('postRef');
    getDoc.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    useAuth.mockReturnValue({
      currentUser: { email: 'user@example.com' }
    });
    
    render(
      <BrowserRouter>
        <PostDetail />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('should display post details when loaded', async () => {
    // Mock Firestore
    doc.mockReturnValue('postRef');
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'test-post-id',
      data: () => mockPost
    });
    
    useAuth.mockReturnValue({
      currentUser: { email: 'user@example.com' }
    });
    
    render(
      <BrowserRouter>
        <PostDetail />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test post content')).toBeInTheDocument();
      expect(screen.getByText('test-document.docx')).toBeInTheDocument();
    });
    
    // Check for components
    expect(screen.getByTestId('post-rating')).toBeInTheDocument();
    expect(screen.getByTestId('comment-section')).toBeInTheDocument();
  });
  
  test('should show edit and delete buttons for post author', async () => {
    // Mock Firestore
    doc.mockReturnValue('postRef');
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'test-post-id',
      data: () => mockPost
    });
    
    // Mock auth context with matching email
    useAuth.mockReturnValue({
      currentUser: { email: 'test@example.com' } // Same as post author
    });
    
    render(
      <BrowserRouter>
        <PostDetail />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /редагувати/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /видалити/i })).toBeInTheDocument();
    });
  });
  
  test('should not show edit and delete buttons for non-authors', async () => {
    // Mock Firestore
    doc.mockReturnValue('postRef');
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'test-post-id',
      data: () => mockPost
    });
    
    // Mock auth context with different email
    useAuth.mockReturnValue({
      currentUser: { email: 'other@example.com' } // Different from post author
    });
    
    render(
      <BrowserRouter>
        <PostDetail />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /редагувати/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /видалити/i })).not.toBeInTheDocument();
    });
  });
  
  test('should handle delete confirmation dialog', async () => {
    // Mock Firestore
    doc.mockReturnValue('postRef');
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'test-post-id',
      data: () => mockPost
    });
    deleteDoc.mockResolvedValue();
    
    // Mock auth context with matching email
    useAuth.mockReturnValue({
      currentUser: { email: 'test@example.com' } // Same as post author
    });
    
    render(
      <BrowserRouter>
        <PostDetail />
      </BrowserRouter>
    );
    
    // Wait for post to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /видалити/i })).toBeInTheDocument();
    });
    
    // Click delete button
    fireEvent.click(screen.getByRole('button', { name: /видалити/i }));
    
    // Check if confirmation dialog appears
    expect(screen.getByText(/видалити статтю?/i)).toBeInTheDocument();
    expect(screen.getByText(/ви впевнені, що хочете видалити цю статтю?/i)).toBeInTheDocument();
    
    // Click cancel
    fireEvent.click(screen.getByRole('button', { name: /скасувати/i }));
    
    // Dialog should close
    expect(screen.queryByText(/видалити статтю?/i)).not.toBeInTheDocument();
    
    // Delete document should not be called
    expect(deleteDoc).not.toHaveBeenCalled();
  });
  
  test('should handle post deletion', async () => {
    // Mock Firestore
    doc.mockReturnValue('postRef');
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'test-post-id',
      data: () => mockPost
    });
    deleteDoc.mockResolvedValue();
    
    // Mock auth context with matching email
    useAuth.mockReturnValue({
      currentUser: { email: 'test@example.com' } // Same as post author
    });
    
    render(
      <BrowserRouter>
        <PostDetail />
      </BrowserRouter>
    );
    
    // Wait for post to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /видалити/i })).toBeInTheDocument();
    });
    
    // Click delete button
    fireEvent.click(screen.getByRole('button', { name: /видалити/i }));
    
    // Check if confirmation dialog appears
    expect(screen.getByText(/видалити статтю?/i)).toBeInTheDocument();
    
    // Click confirm delete
    fireEvent.click(screen.getByRole('button', { name: /видалити/i, exact: true }));
    
    // Check if deleteDoc was called
    expect(deleteDoc).toHaveBeenCalledWith('postRef');
  });
  
  test('should show error when post not found', async () => {
    // Mock Firestore - post does not exist
    doc.mockReturnValue('postRef');
    getDoc.mockResolvedValue({
      exists: () => false
    });
    
    useAuth.mockReturnValue({
      currentUser: { email: 'user@example.com' }
    });
    
    render(
      <BrowserRouter>
        <PostDetail />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/статтю не знайдено/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /повернутися на головну/i })).toBeInTheDocument();
    });
  });
});