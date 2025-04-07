import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleAuthProvider } from "./firebase";

// Функція для конвертації кодів помилок Firebase у зрозумілі повідомлення
export const getErrorMessage = (errorCode) => {
  switch (errorCode) {
      case 'auth/invalid-credential':
          return 'Невірний логін або пароль. Перевірте введені дані.';
      case 'auth/user-not-found':
          return 'Користувача з таким email не знайдено.';
      case 'auth/wrong-password':
          return 'Невірний пароль.';
      case 'auth/email-already-in-use':
          return 'Користувач з таким email вже існує.';
      case 'auth/weak-password':
          return 'Пароль занадто простий. Використовуйте мінімум 6 символів.';
      case 'auth/network-request-failed':
          return 'Проблема з мережею. Перевірте підключення до Інтернету.';
      case 'auth/popup-closed-by-user':
          return 'Вікно входу було закрито до завершення авторизації.';
      case 'auth/cancelled-popup-request':
          return 'Операцію скасовано через відкриття декількох спливаючих вікон.';
      case 'auth/popup-blocked':
          return 'Спливаюче вікно було заблоковано. Дозвольте спливаючі вікна для цього сайту.';
      default:
          return `Помилка: ${errorCode}`;
  }
};

// Реєстрація користувача
export const doCreateUserWithEmailAndPassword = async (email, password, displayName = '') => {
  try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Якщо вказано ім'я користувача, оновлюємо профіль
      if (displayName) {
          await updateProfile(userCredential.user, { displayName });
      }
      
      // Опціонально можна відправити підтвердження email
      await sendEmailVerification(userCredential.user);
      
      return { user: userCredential.user, error: null };
  } catch (error) {
      return { user: null, error: getErrorMessage(error.code) };
  }
};

// Вхід з email і паролем
export const doSignInWithEmailAndPassword = async (email, password) => {
  try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
  } catch (error) {
      return { user: null, error: getErrorMessage(error.code) };
  }
};

// Вхід через Google
export const doSignInWithGoogle = async () => {
  try {
      const userCredential = await signInWithPopup(auth, googleAuthProvider);
      return { user: userCredential.user, error: null };
  } catch (error) {
      return { user: null, error: getErrorMessage(error.code) };
  }
};

// Вихід користувача (виправлений код)
export const doSignOut = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error.code) };
  }
};



// Скидання пароля
export const doPasswordReset = async (email) => {
  try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, error: null };
  } catch (error) {
      return { success: false, error: getErrorMessage(error.code) };
  }
};
