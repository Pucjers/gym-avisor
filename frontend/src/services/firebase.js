import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
 
const firebaseConfig = {
  apiKey: "AIzaSyC30ilNlhFFBQjbcaRYL8u8VIElgnFVLzI",
  authDomain: "blog-platform-55ed0.firebaseapp.com",
  projectId: "blog-platform-55ed0",
  storageBucket: "blog-platform-55ed0.firebasestorage.app",
  messagingSenderId: "843008682660",
  appId: "1:843008682660:web:fe6a3c4a4e9f86822f5431"
};

// Ініціалізуємо Firebase App
export const app = initializeApp(firebaseConfig);

// Сервіси Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Провайдери для аутентифікації
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});