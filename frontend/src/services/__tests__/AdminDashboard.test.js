 
  import React from 'react';
  import { render, screen, waitFor } from '@testing-library/react';
  import { BrowserRouter } from 'react-router-dom';
  import AdminDashboard from '../../components/admin/AdminDashboard';
  import { useAuth } from '../../contexts/AuthContext';
  import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
  
  jest.mock('../../contexts/AuthContext');
  jest.mock('firebase/firestore');
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn()
  }));
  
  describe('AdminDashboard Component', () => {
    const mockPosts = [
      {
        id: 'post1',
        title: 'First Post',
        author: 'user1@example.com',
        createdAt: { toDate: () => new Date('2023-01-01') }
      },
      {
        id: 'post2',
        title: 'Second Post',
        author: 'user2@example.com',
        createdAt: { toDate: () => new Date('2023-01-02') }
      }
    ];
    
    const mockUsers = [
      {
        id: 'user1',
        email: 'user1@example.com',
        displayName: 'User One',
        role: 'admin',
        createdAt: { toDate: () => new Date('2023-01-01') }
      },
      {
        id: 'user2',
        email: 'user2@example.com',
        displayName: 'User Two',
        role: 'user',
        createdAt: { toDate: () => new Date('2023-01-02') }
      }
    ];
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Mock auth context
      useAuth.mockReturnValue({
        currentUser: { 
          uid: 'admin-id', 
          email: 'admin@example.com',
          displayName: 'Admin User'
        },
        isAdmin: true
      });
      
      // Mock Firestore collections
      collection.mockImplementation((db, collectionName) => {
        return { collectionName };
      });
      
      query.mockReturnValue('mockQuery');
      orderBy.mockReturnValue('mockOrderBy');
      limit.mockReturnValue('mockLimit');
      where.mockReturnValue('mockWhere');
      
      // Mock getDocs for different collections
      getDocs.mockImplementation((q) => {
        if (q.collectionName === 'posts') {
          return Promise.resolve({
            size: mockPosts.length,
            docs: mockPosts.map(post => ({
              id: post.id,
              data: () => post
            }))
          });
        } else if (q.collectionName === 'users') {
          return Promise.resolve({
            size: mockUsers.length,
            docs: mockUsers.map(user => ({
              id: user.id,
              data: () => user
            }))
          });
        } else if (q.collectionName === 'comments') {
          return Promise.resolve({
            size: 5, // 5 comments total
            docs: []
          });
        } else {
          return Promise.resolve({ size: 0, docs: [] });
        }
      });
    });
    
    test('should render dashboard with statistics', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );
      
      // Initially should show loading state
      expect(screen.getByText(/завантаження даних для адміністративної панелі/i)).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/завантаження даних для адміністративної панелі/i)).not.toBeInTheDocument();
      });
      
      // Dashboard title should be displayed
      expect(screen.getByText(/адміністративна панель/i)).toBeInTheDocument();
      
      // Statistics should be displayed
      expect(screen.getByText(/всього статей/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 posts
      expect(screen.getByText(/користувачів/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 users
      expect(screen.getByText(/коментарі/i)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // 5 comments
      
      // Navigation buttons should be displayed
      expect(screen.getByRole('button', { name: /керувати статтями/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /керувати користувачами/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /керувати коментарями/i })).toBeInTheDocument();
      
      // Recent posts tab should be active by default
      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('Second Post')).toBeInTheDocument();
    });
    
    test('should switch between tabs', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/завантаження даних для адміністративної панелі/i)).not.toBeInTheDocument();
      });
      
      // Initially, posts tab should be active
      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('Second Post')).toBeInTheDocument();
      
      // Click on users tab
      fireEvent.click(screen.getByRole('tab', { name: /нові користувачі/i }));
      
      // Users should now be displayed
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();
      expect(screen.getByText(/роль: admin/i)).toBeInTheDocument();
      expect(screen.getByText(/роль: user/i)).toBeInTheDocument();
    });
  });