import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreatePost from '../../components/posts/CreatePost';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('firebase/firestore');
jest.mock('firebase/storage');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));
jest.mock('@tinymce/tinymce-react', () => ({
  Editor: ({ onInit, onEditorChange }) => {
    // Store the ref for tests to access
    React.useEffect(() => {
      onInit(null, { setContent: jest.fn() });
    }, [onInit]);
    
    return (
      <div data-testid="tinymce-editor">
        <textarea
          data-testid="editor-textarea"
          onChange={(e) => onEditorChange(e.target.value)}
        />
      </div>
    );
  }
}));
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false
  })
}));

describe('CreatePost Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth context
    useAuth.mockReturnValue({
      currentUser: { uid: 'user-id', email: 'test@example.com' }
    });
    
    // Mock Firestore
    collection.mockReturnValue('postsCollection');
    addDoc.mockResolvedValue({ id: 'new-post-id' });
    
    // Mock Firebase Storage
    ref.mockReturnValue({ fullPath: 'documents/user-id/file.docx' });
    uploadBytesResumable.mockReturnValue({
      on: jest.fn((event, progressCallback, errorCallback, completeCallback) => {
        // Simulate upload completion
        completeCallback();
      }),
      snapshot: { ref: {} }
    });
    getDownloadURL.mockResolvedValue('https://example.com/file.docx');
  });
  
  test('should render post creation form', () => {
    render(
      <BrowserRouter>
        <CreatePost />
      </BrowserRouter>
    );
    
    // Form elements should be rendered
    expect(screen.getByLabelText(/заголовок статті/i)).toBeInTheDocument();
    expect(screen.getByTestId('tinymce-editor')).toBeInTheDocument();
    expect(screen.getByText(/завантажити docx/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /створити статтю/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /скасувати/i })).toBeInTheDocument();
  });
  
  test('should validate form before submission', async () => {
    render(
      <BrowserRouter>
        <CreatePost />
      </BrowserRouter>
    );
    
    // Try to submit empty form
    fireEvent.click(screen.getByRole('button', { name: /створити статтю/i }));
    
    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText(/заповніть усі поля/i)).toBeInTheDocument();
    });
    
    // addDoc should not be called
    expect(addDoc).not.toHaveBeenCalled();
  });
  
  test('should handle post creation successfully', async () => {
    render(
      <BrowserRouter>
        <CreatePost />
      </BrowserRouter>
    );
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/заголовок статті/i), {
      target: { value: 'Test Post Title' }
    });
    
    // Fill the editor content
    fireEvent.change(screen.getByTestId('editor-textarea'), {
      target: { value: '<p>Test post content</p>' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /створити статтю/i }));
    
    // Check if addDoc was called with correct data
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        'postsCollection',
        expect.objectContaining({
          title: 'Test Post Title',
          content: '<p>Test post content</p>',
          contentHtml: '<p>Test post content</p>',
          author: 'test@example.com',
          authorId: 'user-id',
          isFileUploading: false
        })
      );
    });
  });
  
  test('should handle file upload when file is selected', async () => {
    // Mock file
    const file = new File(['dummy content'], 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    
    // Mock mammoth to simulate DOCX processing
    global.mammoth = {
      convertToHtml: jest.fn().mockResolvedValue({
        value: '<p>Converted HTML content</p>'
      })
    };
    
    render(
      <BrowserRouter>
        <CreatePost />
      </BrowserRouter>
    );
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/заголовок статті/i), {
      target: { value: 'Test Post with File' }
    });
    
    // Fill the editor content
    fireEvent.change(screen.getByTestId('editor-textarea'), {
      target: { value: '<p>Test post content with file</p>' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /створити статтю/i }));
    
    // Check if addDoc was called
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });
  });
});

// Firebase Services Integration Tests
// File: src/services/__tests__/firebase.test.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { app, auth, db, storage, googleAuthProvider } from '../../services/firebase';

// Mock Firebase libraries
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue('mockApp')
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue('mockAuth'),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    setCustomParameters: jest.fn()
  }))
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn().mockReturnValue('mockFirestore')
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn().mockReturnValue('mockStorage')
}));

describe('Firebase Services', () => {
  test('should initialize Firebase app with config', () => {
    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: expect.any(String),
      authDomain: expect.any(String),
      projectId: expect.any(String),
      storageBucket: expect.any(String),
      messagingSenderId: expect.any(String),
      appId: expect.any(String)
    });
    
    expect(app).toBe('mockApp');
  });
  
  test('should initialize Firebase Auth', () => {
    expect(getAuth).toHaveBeenCalledWith('mockApp');
    expect(auth).toBe('mockAuth');
  });
  
  test('should initialize Firestore', () => {
    expect(getFirestore).toHaveBeenCalledWith('mockApp');
    expect(db).toBe('mockFirestore');
  });
  
  test('should initialize Firebase Storage', () => {
    expect(getStorage).toHaveBeenCalledWith('mockApp');
    expect(storage).toBe('mockStorage');
  });
  
  test('should setup Google Auth Provider', () => {
    expect(GoogleAuthProvider).toHaveBeenCalled();
    expect(googleAuthProvider.setCustomParameters).toHaveBeenCalledWith({
      prompt: 'select_account'
    });
  });
});