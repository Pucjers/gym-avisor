  
  import React from 'react';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { BrowserRouter } from 'react-router-dom';
  import Header from '../../components/auth/Header';
  import { useAuth } from '../../contexts/AuthContext';
  import { doSignOut } from '../../services/auth';
  import { ColorModeContext } from '../../App';
  
  jest.mock('../../contexts/AuthContext');
  jest.mock('../../services/auth');
  jest.mock('@mui/material/useMediaQuery', () => jest.fn(() => false));
  
  describe('Header Component', () => {
    const toggleColorMode = jest.fn();
    const mockTheme = { palette: { mode: 'light' } };
    
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    const renderHeader = (userLoggedIn = false, isAdmin = false) => {
      useAuth.mockReturnValue({
        userLoggedIn,
        isAdmin,
        currentUser: userLoggedIn ? { email: 'test@example.com' } : null
      });
      
      doSignOut.mockResolvedValue({ success: true });
      
      return render(
        <BrowserRouter>
          <ColorModeContext.Provider value={{ toggleColorMode, mode: 'light' }}>
            <Header />
          </ColorModeContext.Provider>
        </BrowserRouter>
      );
    };
    
    test('should render logo and navigation links', () => {
      renderHeader();
      
      expect(screen.getByText(/блог-платформа/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /головна/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /спортзали/i })).toBeInTheDocument();
    });
    
    test('should render login and register links when user is not logged in', () => {
      renderHeader(false);
      
      expect(screen.getByRole('link', { name: /увійти/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /зареєструватися/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /вийти/i })).not.toBeInTheDocument();
    });
    
    test('should render create post and logout buttons when user is logged in', () => {
      renderHeader(true);
      
      expect(screen.queryByRole('link', { name: /увійти/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /зареєструватися/i })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /створити статтю/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /вийти/i })).toBeInTheDocument();
    });
    
    test('should render admin panel link when user is an admin', () => {
      renderHeader(true, true);
      
      expect(screen.getByRole('link', { name: /адмін-панель/i })).toBeInTheDocument();
    });
    
    test('should not render admin panel link for regular users', () => {
      renderHeader(true, false);
      
      expect(screen.queryByRole('link', { name: /адмін-панель/i })).not.toBeInTheDocument();
    });
    
    test('should handle logout when logout button is clicked', async () => {
      renderHeader(true);
      
      fireEvent.click(screen.getByRole('button', { name: /вийти/i }));
      
      expect(doSignOut).toHaveBeenCalled();
    });
    
    test('should handle theme toggle', () => {
      renderHeader();
      
      fireEvent.click(screen.getByRole('button', { name: /темна тема/i }));
      
      expect(toggleColorMode).toHaveBeenCalled();
    });
  });