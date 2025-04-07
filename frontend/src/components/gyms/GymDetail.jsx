import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Divider,
  Rating,
  Chip,
  Grid,
  Card,
  CardMedia,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Web as WebIcon,
  AccessTime as TimeIcon,
  DirectionsWalk as DirectionsIcon
} from '@mui/icons-material';

const GymDetail = () => {
  const { id } = useParams();
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchGym = async () => {
      try {
        console.log("Отримуємо спортзал з ID:", id);
        
        setLoading(true);
        const docRef = doc(db, 'gyms', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const gymData = { id: docSnap.id, ...docSnap.data() };
          console.log("Отримано дані спортзалу:", gymData);
          setGym(gymData);
        } else {
          console.error("Спортзал не знайдено в базі даних:", id);
          setError("Спортзал не знайдено");
        }
      } catch (err) {
        console.error("Помилка отримання даних:", err);
        setError(`Помилка отримання даних: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchGym();
    } else {
      setError("Не вказано ID спортзалу");
      setLoading(false);
    }
  }, [id]);
  
  // Функція для отримання назви типу спортзалу
  const getTypeName = (type) => {
    switch (type) {
      case 'gym': return 'Тренажерний зал';
      case 'crossfit': return 'CrossFit';
      case 'yoga': return 'Йога';
      case 'pool': return 'Басейн';
      case 'martial_arts': return 'Бойові мистецтва';
      case 'dance': return 'Танці';
      case 'tennis': return 'Теніс';
      case 'table_tennis': return 'Настільний теніс';
      default: return 'Інше';
    }
  };
  
  // Обробник для побудови маршруту до спортзалу
  const handleShowDirections = () => {
    if (!gym || !gym.location) return;
    
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${gym.location.lat},${gym.location.lng}`,
      '_blank'
    );
  };
  
  // Повернення до списку спортзалів
  const handleGoBack = () => {
    navigate('/gyms');
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Завантаження інформації про спортзал...
        </Typography>
      </Container>
    );
  }
  
  if (error || !gym) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Сталася помилка при завантаженні даних"}
        </Alert>
        <Button
          component={Link}
          to="/gyms"
          startIcon={<ArrowBackIcon />}
          variant="contained"
        >
          Повернутися до карти
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        onClick={handleGoBack}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
      >
        Повернутися до карти
      </Button>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {gym.name}
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Chip 
            label={getTypeName(gym.type)} 
            color="primary" 
            sx={{ mr: 1 }} 
          />
          {gym.city && (
            <Chip 
              label={gym.city} 
              variant="outlined" 
            />
          )}
        </Box>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 3 }}>
              <CardMedia
                component="img"
                height="300"
                image={gym.imageUrl || 'https://via.placeholder.com/600x300?text=Gym'}
                alt={gym.name}
              />
            </Card>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating 
                value={parseFloat(gym.rating) || 0} 
                precision={0.5} 
                readOnly 
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({gym.reviewsCount || 0} відгуків)
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<DirectionsIcon />}
              onClick={handleShowDirections}
              disabled={!gym.location}
              fullWidth
              sx={{ mb: 2 }}
            >
              Прокласти маршрут
            </Button>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Про заклад
            </Typography>
            <Typography variant="body1" paragraph>
              {gym.description}
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Контактна інформація
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Адреса" 
                  secondary={gym.address} 
                />
              </ListItem>
              
              {gym.phone && (
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Телефон" 
                    secondary={
                      <a 
                        href={`tel:${gym.phone}`} 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {gym.phone}
                      </a>
                    } 
                  />
                </ListItem>
              )}
              
              {gym.website && (
                <ListItem>
                  <ListItemIcon>
                    <WebIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Веб-сайт" 
                    secondary={
                      <a 
                        href={gym.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {gym.website}
                      </a>
                    } 
                  />
                </ListItem>
              )}
              
              {gym.hours && (
                <ListItem>
                  <ListItemIcon>
                    <TimeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Години роботи" 
                    secondary={gym.hours} 
                  />
                </ListItem>
              )}
            </List>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default GymDetail;