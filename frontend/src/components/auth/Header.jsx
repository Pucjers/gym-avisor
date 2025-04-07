import React, { useEffect, useState, useContext } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { doSignOut } from "../../services/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ColorModeContext } from "../../App"; // Додали імпорт контексту теми
import {
  AppBar,
  Toolbar, 
  Typography,
  Button,
  IconButton,
  Container,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Tooltip // Додали Tooltip для кращого UX
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Logout as LogoutIcon,
  Article as ArticleIcon,
  AdminPanelSettings as AdminIcon,
  FitnessCenter as FitnessCenterIcon,
  Brightness4 as Brightness4Icon, // Іконка для темної теми
  Brightness7 as Brightness7Icon // Іконка для світлої теми
} from '@mui/icons-material';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userLoggedIn, currentUser, isAdmin } = useAuth();
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const colorMode = useContext(ColorModeContext); // Додали використання контексту теми

  useEffect(() => {
    if (logoutSuccess) {
      navigate("/login");
      setLogoutSuccess(false);
    }
  }, [logoutSuccess, navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    const result = await doSignOut();
    if (result.success) {
      setLogoutSuccess(true);
    } else {
      console.error("Помилка виходу:", result.error);
    }
    setMobileOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          Блог-платформа
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            component={Link} 
            to="/home"
            selected={isActive('/home')}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Головна" />
          </ListItemButton>
        </ListItem>
        
        {/* Додаємо пункт меню для спортзалів */}
        <ListItem disablePadding>
          <ListItemButton 
            component={Link} 
            to="/gyms"
            selected={isActive('/gyms')}
          >
            <ListItemIcon>
              <FitnessCenterIcon />
            </ListItemIcon>
            <ListItemText primary="Спортзали" />
          </ListItemButton>
        </ListItem>

        {!userLoggedIn ? (
          <>
            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                to="/login"
                selected={isActive('/login')}
              >
                <ListItemIcon>
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText primary="Увійти" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                to="/register"
                selected={isActive('/register')}
              >
                <ListItemIcon>
                  <PersonAddIcon />
                </ListItemIcon>
                <ListItemText primary="Зареєструватися" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                to="/create-post"
                selected={isActive('/create-post')}
              >
                <ListItemIcon>
                  <ArticleIcon />
                </ListItemIcon>
                <ListItemText primary="Створити статтю" />
              </ListItemButton>
            </ListItem>
            
            {/* Пункт меню адміністратора */}
            {isAdmin && (
              <ListItem disablePadding>
                <ListItemButton 
                  component={Link} 
                  to="/admin"
                  selected={isActive('/admin')}
                >
                  <ListItemIcon>
                    <AdminIcon />
                  </ListItemIcon>
                  <ListItemText primary="Адмін-панель" />
                </ListItemButton>
              </ListItem>
            )}

            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                to="/chat"
                selected={isActive('/chat')}
              >
                <ListItemText primary="Чат з AI" />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Вийти" />
              </ListItemButton>
            </ListItem>
          </>
        )}
        
        {/* Додаємо перемикач теми в боковому меню */}
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          <ListItemButton onClick={colorMode.toggleColorMode}>
            <ListItemIcon>
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </ListItemIcon>
            <ListItemText primary={theme.palette.mode === 'dark' ? 'Світла тема' : 'Темна тема'} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" color="primary">
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/home"
              sx={{ 
                flexGrow: 1, 
                color: 'white',
                textDecoration: 'none',
                fontWeight: 700
              }}
            >
              Блог-платформа
            </Typography>
            
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/home"
                  sx={{ mx: 1, fontWeight: isActive('/home') ? 700 : 400 }}
                >
                  Головна
                </Button>
                
                {/* Додаємо кнопку для спортзалів */}
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/gyms"
                  sx={{ mx: 1, fontWeight: isActive('/gyms') ? 700 : 400 }}
                  startIcon={<FitnessCenterIcon />}
                >
                  Спортзали
                </Button>
                
                {!userLoggedIn ? (
                  <>
                    <Button 
                      color="inherit" 
                      component={Link} 
                      to="/login"
                      sx={{ mx: 1, fontWeight: isActive('/login') ? 700 : 400 }}
                    >
                      Увійти
                    </Button>
                    <Button 
                      color="inherit" 
                      component={Link} 
                      to="/register"
                      sx={{ mx: 1, fontWeight: isActive('/register') ? 700 : 400 }}
                    >
                      Зареєструватися
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      color="inherit" 
                      component={Link} 
                      to="/create-post"
                      sx={{ mx: 1, fontWeight: isActive('/create-post') ? 700 : 400 }}
                    >
                      Створити статтю
                    </Button>
                    
                    {/* Кнопка адміністратора */}
                    {isAdmin && (
                      <Button 
                        color="inherit" 
                        component={Link} 
                        to="/admin"
                        sx={{ 
                          mx: 1, 
                          fontWeight: isActive('/admin') ? 700 : 400,
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                          }
                        }}
                        startIcon={<AdminIcon />}
                      >
                        Адмін-панель
                      </Button>
                    )}
                    <Button 
                      color="inherit" 
                      component={Link} 
                      to="/chat"
                      sx={{ mx: 1, fontWeight: isActive('/chat') ? 700 : 400 }}
                    >
                      Чат 
                    </Button>
                    
                    <Button 
                      color="inherit" 
                      onClick={handleLogout}
                      sx={{ mx: 1 }}
                    >
                      Вийти
                    </Button>
                  </>
                )}
                
                {/* Додаємо перемикач темної теми */}
                <Tooltip title={theme.palette.mode === 'dark' ? 'Світла тема' : 'Темна тема'}>
                  <IconButton
                    onClick={colorMode.toggleColorMode}
                    color="inherit"
                    sx={{ 
                      ml: 1,
                      transition: 'transform 0.3s',
                      '&:hover': { transform: 'rotate(15deg)' }
                    }}
                  >
                    {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Краще для мобільної продуктивності
          }}
          sx={{
            display: { xs: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Додаємо порожній toolbar для компенсації фіксованого AppBar */}
      <Toolbar />
    </>
  );
};

export default Header;