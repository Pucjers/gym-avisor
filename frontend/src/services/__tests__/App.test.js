import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App, { ColorModeContext } from '../../App';

// Mock components to simplify the test
jest.mock('../../components/auth/Header', () => () => (
  <div data-testid="header">
    <button data-testid="theme-toggle">Toggle Theme</button>
  </div>
));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useRoutes: () => <div data-testid="routes">Routes Content</div>
}));

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock useMediaQuery
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn().mockReturnValue(false) // Default to light theme
}));

describe('App Component with Theme Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });
  
  test('should apply default theme based on system preference', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Theme context should be initialized
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('routes')).toBeInTheDocument();
    
    // localStorage should be checked
    expect(window.localStorage.getItem).toHaveBeenCalledWith('themeMode');
    
    // Default theme should be set in document.body
    expect(document.body.getAttribute('data-theme')).toBe('light');
  });
  
  test('should toggle theme when theme button is clicked', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Initial theme should be light
    expect(document.body.getAttribute('data-theme')).toBe('light');
    
    // Click theme toggle button
    fireEvent.click(screen.getByTestId('theme-toggle'));
    
    // Theme should change to dark
    expect(document.body.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('themeMode', 'dark');
    
    // Click again to toggle back to light
    fireEvent.click(screen.getByTestId('theme-toggle'));
    
    // Theme should change back to light
    expect(document.body.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('themeMode', 'light');
  });
  
  test('should apply theme from localStorage', () => {
    // Set theme in localStorage
    window.localStorage.setItem('themeMode', 'dark');
    
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Theme should be loaded from localStorage
    expect(document.body.getAttribute('data-theme')).toBe('dark');
  });
});