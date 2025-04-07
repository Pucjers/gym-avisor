import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Typography, Container, Paper, Button, Box } from '@mui/material';
import { Link } from "react-router-dom";
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';

const AdminRoute = ({ children }) => {
  const { userLoggedIn, isAdmin, loading } = useAuth();
  
  // Показуємо завантаження, якщо статус користувача ще перевіряється
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6">Перевірка прав доступу...</Typography>
      </Container>
    );
  }
  
  // Перенаправляємо на сторінку логіну, якщо користувач не авторизований
  if (!userLoggedIn) {
    return <Navigate to="/login" />;
  }
  
  // Якщо користувач авторизований, але не є адміністратором
  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 2 }}>
            <AdminIcon color="error" sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h5" color="error" gutterBottom>
            Доступ заборонено
          </Typography>
          <Typography variant="body1" paragraph>
            У вас немає прав доступу до адміністративної панелі.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Ця сторінка доступна тільки для адміністраторів блог-платформи.
          </Typography>
          <Button
            component={Link}
            to="/home"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Повернутися на головну
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // Якщо користувач є адміністратором, показуємо компонент
  return children;
};

export default AdminRoute;