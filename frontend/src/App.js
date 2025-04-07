// App.js
import React, { Suspense, lazy } from 'react';
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Header from "./components/auth/Header";
import Home from "./components/home/Home";
import { AuthProvider } from "./contexts/AuthContext";
import { useRoutes, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import CreatePost from "./components/posts/CreatePost";
import PostDetail from "./components/posts/PostDetail";
import EditPost from "./components/posts/EditPost";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminPosts from "./components/admin/AdminPosts";
import AdminUsers from "./components/admin/AdminUsers";
import GymMap from "./components/gyms/GymMap"; 
import CityGymsFetcher from "./components/gyms/CityGymsFetcher";
import GymDetail from "./components/gyms/GymDetail";
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { createAppTheme } from './theme';
import { useState, useMemo, createContext, useEffect } from 'react';
import ChatAI from "./components/ChatAI";

// Створюємо контекст для управління темою
export const ColorModeContext = createContext({ 
  toggleColorMode: () => {},
  mode: 'light'
});

const LoginComponent = lazy(() => import("./components/auth/Login"));
const RegisterComponent = lazy(() => import("./components/auth/Register"));

function App() {
  // Визначаємо системні налаштування теми
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // Перевіряємо збережені налаштування теми або використовуємо системні
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || (prefersDarkMode ? 'dark' : 'light');
  });
  
  // Зберігаємо вибір теми при зміні
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    // Додаємо атрибут data-theme до body для можливості стилізації не-MUI елементів
    document.body.setAttribute('data-theme', mode);
  }, [mode]);

  // Функція для перемикання теми
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode],
  );

  // Створюємо тему відповідно до поточного режиму
  const theme = useMemo(
    () => createAppTheme(mode),
    [mode],
  );

  const routesArray = [
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/home",
      element: <Home />,
    },
    {
      path: "/create-post",
      element: <ProtectedRoute><CreatePost /></ProtectedRoute>,
    },
    {
      path: "/post/:id",
      element: <PostDetail />,
    },
    {
      path: "/edit-post/:id",
      element: <ProtectedRoute><EditPost /></ProtectedRoute>,
    },
    {
      path: "/admin",
      element: <AdminRoute><AdminDashboard /></AdminRoute>,
    },
    {
      path: "/gyms",
      element: <GymMap />,
    },
    {
      path: "/gym/:id",
      element: <GymDetail />,
    },
    {
      path: "/city-gyms",
      element: <AdminRoute><CityGymsFetcher /></AdminRoute>,
    },
    {
      path: "/admin/posts",
      element: <AdminRoute><AdminPosts /></AdminRoute>,
    },
    {
      path: "/admin/users",
      element: <AdminRoute><AdminUsers /></AdminRoute>,
    },
    {
      path: "/chat",
      element: <ChatAI />,
    },
    {
      path: "*",
      element: <Navigate to="/" replace />,
    }
  ];
  
  let routesElement = useRoutes(routesArray);
  
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Header />
          <Suspense fallback={<div>Loading...</div>}>
            <div className="w-full min-h-screen flex flex-col">
              {routesElement}
            </div>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;