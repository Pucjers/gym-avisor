import {
    doCreateUserWithEmailAndPassword,
    doSignInWithEmailAndPassword,
    doSignInWithGoogle,
    doSignOut,
    getErrorMessage
  } from '../../services/auth';
  import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    sendEmailVerification
  } from "firebase/auth";
  
  // Mock Firebase modules
  jest.mock('firebase/auth');
  
  describe('Authentication Service', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });
  
    test('should register a new user successfully', async () => {
      // Mock implementation
      const userCredential = {
        user: { uid: '123', email: 'test@example.com' }
      };
      createUserWithEmailAndPassword.mockResolvedValue(userCredential);
      updateProfile.mockResolvedValue();
      sendEmailVerification.mockResolvedValue();
  
      // Call the function
      const result = await doCreateUserWithEmailAndPassword('test@example.com', 'password123', 'Test User');
  
      // Assertions
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(updateProfile).toHaveBeenCalled();
      expect(sendEmailVerification).toHaveBeenCalled();
      expect(result.user).toEqual(userCredential.user);
      expect(result.error).toBeNull();
    });
  
    test('should handle registration error', async () => {
      // Mock implementation for error
      const errorMock = { code: 'auth/email-already-in-use' };
      createUserWithEmailAndPassword.mockRejectedValue(errorMock);
  
      // Call the function
      const result = await doCreateUserWithEmailAndPassword('test@example.com', 'password123');
  
      // Assertions
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(result.user).toBeNull();
      expect(result.error).toBe('Користувач з таким email вже існує.');
    });
  
    test('should sign in user with email and password', async () => {
      // Mock implementation
      const userCredential = {
        user: { uid: '123', email: 'test@example.com' }
      };
      signInWithEmailAndPassword.mockResolvedValue(userCredential);
  
      // Call the function
      const result = await doSignInWithEmailAndPassword('test@example.com', 'password123');
  
      // Assertions
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result.user).toEqual(userCredential.user);
      expect(result.error).toBeNull();
    });
  
    test('should handle sign in error', async () => {
      // Mock implementation for error
      const errorMock = { code: 'auth/wrong-password' };
      signInWithEmailAndPassword.mockRejectedValue(errorMock);
  
      // Call the function
      const result = await doSignInWithEmailAndPassword('test@example.com', 'wrong-password');
  
      // Assertions
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
      expect(result.user).toBeNull();
      expect(result.error).toBe('Невірний пароль.');
    });
  
    test('should sign in with Google', async () => {
      // Mock implementation
      const userCredential = {
        user: { uid: '123', email: 'test@gmail.com', displayName: 'Test User' }
      };
      signInWithPopup.mockResolvedValue(userCredential);
  
      // Call the function
      const result = await doSignInWithGoogle();
  
      // Assertions
      expect(signInWithPopup).toHaveBeenCalled();
      expect(result.user).toEqual(userCredential.user);
      expect(result.error).toBeNull();
    });
  
    test('should sign out user', async () => {
      // Mock implementation
      signOut.mockResolvedValue();
  
      // Call the function
      const result = await doSignOut();
  
      // Assertions
      expect(signOut).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });
  
    test('should return appropriate error messages', () => {
      // Test various error codes
      expect(getErrorMessage('auth/user-not-found')).toBe('Користувача з таким email не знайдено.');
      expect(getErrorMessage('auth/wrong-password')).toBe('Невірний пароль.');
      expect(getErrorMessage('auth/unknown-error')).toBe('Помилка: auth/unknown-error');
    });
  });