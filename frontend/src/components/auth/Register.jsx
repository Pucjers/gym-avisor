import React, { useState } from 'react';
import { Navigate, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doCreateUserWithEmailAndPassword } from '../../services/auth';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Grid,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Link as MuiLink
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { userLoggedIn } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Перевірка паролю
    if (password !== confirmPassword) {
      setErrorMessage('Паролі не співпадають');
      return;
    }
    
    if (!isRegistering) {
      setIsRegistering(true);
      setErrorMessage('');
      
      const result = await doCreateUserWithEmailAndPassword(email, password);
      if (result.error) {
        setErrorMessage(result.error);
        setIsRegistering(false);
      }
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (userLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Container maxWidth="xs" sx={{ display: 'flex', minHeight: '100vh' }}>
      <Grid container sx={{ my: 'auto', py: 4 }}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">
                Створення облікового запису
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Приєднуйтесь до нашої спільноти!
              </Typography>
            </Box>
            
            <form onSubmit={onSubmit}>
              <TextField
                fullWidth
                label="Електронна пошта"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Підтвердження паролю"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleToggleConfirmPassword}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {errorMessage && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errorMessage}
                </Alert>
              )}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isRegistering}
                startIcon={!isRegistering && <PersonAddIcon />}
                sx={{ mt: 3, mb: 2, py: 1.2 }}
              >
                {isRegistering ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Зареєструватися'
                )}
              </Button>
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <MuiLink component={RouterLink} to="/login" variant="body2">
                  Вже маєте обліковий запис? Увійти
                </MuiLink>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Register;