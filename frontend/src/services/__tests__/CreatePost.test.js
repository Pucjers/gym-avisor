// src/services/__tests__/CreatePost.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreatePost from '../../components/posts/CreatePost';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Mock Editor component from TinyMCE
jest.mock('@tinymce/tinymce-react', () => ({
  Editor: jest.fn(props => {
    // Fix: Don't use React directly in mock factory
    const mockEditor = props => {
      // Store the ref for tests to access
      if (props.onInit) {
        setTimeout(() => {
          props.onInit(null, { setContent: jest.fn() });
        }, 0);
      }
      
      return (
        <div data-testid="mock-editor">
          <textarea 
            data-testid="editor-textarea"
            onChange={e => props.onEditorChange && props.onEditorChange(e.target.value)}
          />
        </div>
      );
    };
    
    return mockEditor(props);
  })
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

// Mock Storage functions
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mock Dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('CreatePost Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock navigate function
    const navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
    
    // Mock user from AuthContext
    useAuth.mockReturnValue({
      currentUser: { uid: 'test-uid', email: 'test@example.com' },
      userLoggedIn: true,
    });
    
    // Mock Firestore functions
    collection.mockReturnValue('posts-collection');
    addDoc.mockResolvedValue({ id: 'new-post-id' });
    serverTimestamp.mockReturnValue('timestamp');
    
    // Mock Storage functions
    ref.mockReturnValue({ fullPath: 'documents/test-uid/test-file.docx' });
    uploadBytesResumable.mockReturnValue({
      on: jest.fn((event, progressCallback, errorCallback, completeCallback) => {
        // Immediately call the complete callback
        completeCallback();
      }),
      snapshot: { ref: { fullPath: 'documents/test-uid/test-file.docx' } },
    });
    getDownloadURL.mockResolvedValue('https://example.com/test-file.docx');
  });
  
  test('should render CreatePost form', async () => {
    render(<CreatePost />);
    
    // Check if title input is rendered
    expect(screen.getByLabelText(/Заголовок статті/i)).toBeInTheDocument();
    
    // Check if dropzone area is rendered
    expect(screen.getByText(/Перетягніть DOCX файл сюди/i)).toBeInTheDocument();
    
    // Check if TinyMCE editor mock is rendered
    expect(screen.getByTestId('mock-editor')).toBeInTheDocument();
    
    // Check if submit button is rendered
    expect(screen.getByText(/Створити статтю/i)).toBeInTheDocument();
  });
  
  test('should submit form successfully', async () => {
    render(<CreatePost />);
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/Заголовок статті/i), {
      target: { value: 'Test Post Title' },
    });
    
    // Set editor content
    const editorTextarea = screen.getByTestId('editor-textarea');
    fireEvent.change(editorTextarea, {
      target: { value: '<p>Test post content</p>' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByText(/Створити статтю/i));
    
    // Wait for async operations
    await waitFor(() => {
      // Check if addDoc was called with correct data
      expect(addDoc).toHaveBeenCalledWith(
        'posts-collection',
        expect.objectContaining({
          title: 'Test Post Title',
          content: '<p>Test post content</p>',
          contentHtml: '<p>Test post content</p>',
          author: 'test@example.com',
          authorId: 'test-uid',
          createdAt: 'timestamp',
        })
      );
      
      // Check if navigation was called
      expect(useNavigate()).toHaveBeenCalledWith('/post/new-post-id');
    });
  });
  
  test('should show error when form is incomplete', async () => {
    render(<CreatePost />);
    
    // Submit without filling the form
    fireEvent.click(screen.getByText(/Створити статтю/i));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Заповніть усі поля/i)).toBeInTheDocument();
    });
    
    // Verify addDoc was not called
    expect(addDoc).not.toHaveBeenCalled();
  });
});