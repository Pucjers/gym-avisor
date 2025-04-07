import React, { useState } from 'react'
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'
import { Navigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Grid,
  Divider,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon
} from '@mui/icons-material';

const Login = () => {
  const { userLoggedIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }
    if (!isSigningIn) {
      setIsSigningIn(true);
      setErrorMessage('');
      
      const result = await doSignInWithEmailAndPassword(email, password);
      if (result.error) {
        setErrorMessage(result.error);
        setIsSigningIn(false);
      }
    }
  };

  const onGoogleSignIn = (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      setErrorMessage('');
      
      doSignInWithGoogle()
        .then(result => {
          if (result.error) {
            setErrorMessage(result.error);
            setIsSigningIn(false);
          }
        })
        .catch(err => {
          setErrorMessage('Помилка входу через Google');
          setIsSigningIn(false);
        });
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
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
                Вхід до облікового запису
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Раді бачити вас знову!
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
                autoComplete="current-password"
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
              
              {errorMessage && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errorMessage}
                </Alert>
              )}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSigningIn}
                sx={{ mt: 3, mb: 2, py: 1.2 }}
              >
                {isSigningIn ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Увійти'
                )}
              </Button>
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Link component={RouterLink} to="/register" variant="body2">
                  Немає облікового запису? Зареєструватися
                </Link>
              </Box>
            </form>
            
            <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
              <Divider sx={{ flexGrow: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                АБО
              </Typography>
              <Divider sx={{ flexGrow: 1 }} />
            </Box>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={onGoogleSignIn}
              disabled={isSigningIn}
              sx={{ py: 1.2 }}
            >
              Увійти через Google
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Login;