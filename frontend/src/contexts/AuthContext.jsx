import React, { useContext, useState, useEffect, createContext } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  async function initializeUser(user) {
    if (user) {
      setCurrentUser({ ...user });

      // Перевіряємо тип авторизації
      const isEmail = user.providerData.some(
        (provider) => provider.providerId === "password"
      );
      setIsEmailUser(isEmail);

      const isGoogle = user.providerData.some(
        (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
      );
      setIsGoogleUser(isGoogle);

      setUserLoggedIn(true);
      
      // Отримуємо профіль користувача з Firestore
      await fetchUserProfile(user.uid);
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
      setIsEmailUser(false);
      setIsGoogleUser(false);
      setIsAdmin(false);
      setUserProfile(null);
    }

    setLoading(false);
  }
  
  // Функція для отримання профілю користувача
  // Функція для отримання профілю користувача
async function fetchUserProfile(userId) {
  try {
    // Посилання на документ користувача
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Профіль користувача існує
      const userData = userDoc.data();
      setUserProfile(userData);
      
      // Встановлюємо роль адміністратора, якщо вона є в профілі
      setIsAdmin(userData.role === 'admin');
    } else {
      // Профіль користувача не існує - створюємо новий
      // Тут виникає помилка - currentUser може бути null
      
      // Отримуємо дані користувача з auth
      const user = auth.currentUser; // Використовуємо поточного користувача з auth 
      
      if (!user) {
        console.error("Користувач не авторизований");
        setIsAdmin(false);
        return;
      }
      
      const newUserProfile = {
        uid: userId,
        email: user.email, // Використовуємо email з auth.currentUser
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        role: 'user', // Звичайний користувач за замовчуванням
        createdAt: new Date(),
      };
      
      // Зберігаємо новий профіль
      await setDoc(userRef, newUserProfile);
      setUserProfile(newUserProfile);
      setIsAdmin(false);
    }
  } catch (error) {
    console.error("Помилка отримання профілю користувача:", error);
    setIsAdmin(false);
  }
}

  const value = {
    userLoggedIn,
    isEmailUser,
    isGoogleUser,
    currentUser,
    isAdmin,
    userProfile,
    loading,
    setCurrentUser,
    // Додаємо функції для оновлення профілю
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}