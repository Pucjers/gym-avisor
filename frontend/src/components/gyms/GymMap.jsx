import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../services/firebase";
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Container, 
  Typography,
  Box,
  Paper,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  Rating,
  Chip,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slider,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Web as WebIcon,
  AccessTime as TimeIcon,
  FitnessCenter as FitnessCenterIcon,
  DirectionsWalk as DirectionsIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  MyLocation as MyLocationIcon,
  NearMe as NearMeIcon
} from '@mui/icons-material';

// Виправлення проблеми з іконками Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Створюємо спеціальну іконку для відображення позиції користувача
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Компонент для оновлення центру карти
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

// Компонент, що відстежує користувацьке місцеположення
const LocationMarker = ({ onLocationFound }) => {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const map = useMap();

  useEffect(() => {
    // Функція для обробки знайденого місцеположення
    const handleLocationFound = (e) => {
      setPosition(e.latlng);
      setAccuracy(e.accuracy);
      onLocationFound(e.latlng, e.accuracy);
    };

    // Додаємо обробник події знаходження місцеположення
    map.on('locationfound', handleLocationFound);
    
    // Обробник помилки
    const handleLocationError = (e) => {
      console.error("Помилка геолокації:", e.message);
    };
    map.on('locationerror', handleLocationError);
    
    // Не змінюємо центр карти автоматично, це буде робити основний компонент
    map.locate({ setView: false });
    
    // Прибираємо обробники при демонтажі компонента
    return () => {
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
    };
  }, [map, onLocationFound]);

  return position === null ? null : (
    <>
      <Marker position={position} icon={userLocationIcon}>
        <Popup>
          <strong>Ваше місцезнаходження</strong><br />
          Точність: {Math.round(accuracy)} метрів
        </Popup>
      </Marker>
      <Circle 
        center={position} 
        radius={accuracy} 
        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
      />
    </>
  );
};

const GymMap = () => {
  const [gyms, setGyms] = useState([]);
  const [filteredGyms, setFilteredGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedGym, setSelectedGym] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState([49.8397, 24.0297]); // Львів за замовчуванням
  const [mapZoom, setMapZoom] = useState(12);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(0);
  const [searchRadius, setSearchRadius] = useState(2); // радіус пошуку в км
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [nearbyGyms, setNearbyGyms] = useState([]);
  const [showingNearby, setShowingNearby] = useState(false);

  // Завантаження даних про спортзали
  useEffect(() => {
    const fetchGyms = async () => {
      try {
        setLoading(true);
        
        // Отримуємо дані з Firestore
        const gymsCollection = collection(db, "gyms");
        const q = query(gymsCollection, orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        
        const gymsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`Завантажено ${gymsList.length} спортзалів з бази даних`);
        
        // Перевіряємо, чи є дані з локацією
        const gymsWithLocation = gymsList.filter(
          gym => gym.location && gym.location.lat && gym.location.lng
        );
        
        if (gymsWithLocation.length === 0) {
          console.warn("Немає спортзалів з локацією у базі даних");
        }
        
        setGyms(gymsList);
        setFilteredGyms(gymsList);
      } catch (err) {
        console.error("Помилка отримання даних про спортзали:", err);
        setError("Не вдалося завантажити дані про спортзали");
      } finally {
        setLoading(false);
      }
    };

    fetchGyms();
  }, []);

  // Фільтрація спортзалів за пошуком та типом
  useEffect(() => {
    let result = gyms;
    
    // Якщо активний режим "Поблизу", використовуємо тільки найближчі зали
    if (showingNearby && nearbyGyms.length > 0) {
      result = nearbyGyms;
    }
    
    // Фільтрація за типом
    if (filterType !== 'all') {
      result = result.filter(gym => 
        gym.type === filterType || 
        (gym.types && gym.types.includes(filterType))
      );
    }
    
    // Фільтрація за пошуковим запитом
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(gym => 
        gym.name.toLowerCase().includes(query) || 
        (gym.description && gym.description.toLowerCase().includes(query)) ||
        (gym.address && gym.address.toLowerCase().includes(query))
      );
    }
    
    setFilteredGyms(result);
    
    // Центруємо карту на найпершому результаті пошуку, якщо є результати
    // і якщо ми не в режимі "Поблизу"
    if (!showingNearby && result.length > 0 && result[0].location && result[0].location.lat && result[0].location.lng) {
      setMapCenter([result[0].location.lat, result[0].location.lng]);
    }
  }, [gyms, searchQuery, filterType, nearbyGyms, showingNearby]);

  // Функція для обробки знайденого місцеположення
  const handleLocationFound = (latlng, accuracy) => {
    setUserLocation(latlng);
    setLocationAccuracy(accuracy);
    setMapCenter([latlng.lat, latlng.lng]);
    
    // Показуємо повідомлення користувачу
    setSnackbarMessage("Знайдено ваше місцезнаходження");
    setSnackbarOpen(true);
  };

  // Функція для показу найближчих спортзалів
  const showNearbyGyms = () => {
    if (!userLocation) {
      setSnackbarMessage("Спочатку визначте ваше місцезнаходження");
      setSnackbarOpen(true);
      return;
    }
    
    // Функція для розрахунку відстані між двома точками (формула гаверсинусів)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Радіус Землі в км
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance; // відстань в км
    };
    
    // Фільтруємо спортзали, які знаходяться в заданому радіусі
    const nearby = gyms
      .filter(gym => gym.location && gym.location.lat && gym.location.lng)
      .map(gym => {
        const distance = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          gym.location.lat, 
          gym.location.lng
        );
        return { ...gym, distance };
      })
      .filter(gym => gym.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance);
    
    if (nearby.length === 0) {
      setSnackbarMessage(`Не знайдено спортзалів у радіусі ${searchRadius} км`);
      setSnackbarOpen(true);
      setShowingNearby(false);
    } else {
      setNearbyGyms(nearby);
      setShowingNearby(true);
      setSnackbarMessage(`Знайдено ${nearby.length} спортзалів у радіусі ${searchRadius} км`);
      setSnackbarOpen(true);
    }
  };

  // Обробник для відкриття бокової панелі з деталями про спортзал
  const handleGymSelect = (gym) => {
    setSelectedGym(gym);
    setDrawerOpen(true);
  };

  // Обробник для побудови маршруту до спортзалу
  const handleShowDirections = (gym) => {
    if (!gym.location) return;
    
    // Відкриваємо Google Maps з маршрутом
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${gym.location.lat},${gym.location.lng}`,
      '_blank'
    );
  };

  // Функція для отримання кольору чіпа за типом спортзалу
  const getChipColorByType = (type) => {
    switch (type) {
      case 'gym':
        return 'primary';
      case 'crossfit':
        return 'secondary';
      case 'yoga':
        return 'success';
      case 'pool':
        return 'info';
      case 'martial_arts':
        return 'error';
      case 'dance':
        return 'warning';
      case 'tennis':
        return 'default';
      default:
        return 'default';
    }
  };

  // Функція для отримання назви типу спортзалу
  const getTypeName = (type) => {
    switch (type) {
      case 'gym':
        return 'Тренажерний зал';
      case 'crossfit':
        return 'CrossFit';
      case 'yoga':
        return 'Йога';
      case 'pool':
        return 'Басейн';
      case 'martial_arts':
        return 'Бойові мистецтва';
      case 'dance':
        return 'Танці';
      case 'tennis':
        return 'Теніс';
      case 'table_tennis':
        return 'Настільний теніс';
      default:
        return 'Інше';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Карта спортзалів
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Знайдіть найближчий спортзал у вашому районі. Клацніть на маркер для отримання детальної інформації.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Пошук спортзалу"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowingNearby(false); // Вимикаємо режим "Поблизу" при введенні пошуку
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="type-filter-label">Тип спортзалу</InputLabel>
                <Select
                  labelId="type-filter-label"
                  value={filterType}
                  label="Тип спортзалу"
                  onChange={(e) => setFilterType(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">Усі типи</MenuItem>
                  <MenuItem value="gym">Тренажерний зал</MenuItem>
                  <MenuItem value="crossfit">CrossFit</MenuItem>
                  <MenuItem value="yoga">Йога</MenuItem>
                  <MenuItem value="pool">Басейн</MenuItem>
                  <MenuItem value="martial_arts">Бойові мистецтва</MenuItem>
                  <MenuItem value="dance">Танці</MenuItem>
                  <MenuItem value="tennis">Теніс</MenuItem>
                  <MenuItem value="table_tennis">Настільний теніс</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        
        {/* Блок для геолокації та пошуку поблизу */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Пошук спортзалів поблизу
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Button
                variant={userLocation ? "outlined" : "contained"}
                color="primary"
                startIcon={<MyLocationIcon />}
                onClick={() => {
                  // Перевіряємо підтримку геолокації
                  if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const latlng = {
                          lat: position.coords.latitude,
                          lng: position.coords.longitude
                        };
                        handleLocationFound(latlng, position.coords.accuracy);
                      },
                      (error) => {
                        console.error("Помилка геолокації:", error.message);
                        setSnackbarMessage("Не вдалося отримати ваше місцезнаходження");
                        setSnackbarOpen(true);
                      }
                    );
                  } else {
                    setSnackbarMessage("Геолокація не підтримується вашим браузером");
                    setSnackbarOpen(true);
                  }
                }}
                fullWidth
              >
                {userLocation ? "Оновити місцезнаходження" : "Визначити місцезнаходження"}
              </Button>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 2, minWidth: '90px' }}>
                  Радіус пошуку: {searchRadius} км
                </Typography>
                <Slider
                  value={searchRadius}
                  onChange={(e, newValue) => setSearchRadius(newValue)}
                  min={0.5}
                  max={10}
                  step={0.5}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value} км`}
                  disabled={!userLocation}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Button
                variant={showingNearby ? "contained" : "outlined"}
                color="primary"
                startIcon={<NearMeIcon />}
                onClick={showNearbyGyms}
                disabled={!userLocation}
                fullWidth
              >
                {showingNearby ? "Показано найближчі" : "Показати найближчі"}
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <Box>
            {/* Карта OpenStreetMap через Leaflet */}
            <Box sx={{ height: '500px', width: '100%', mb: 3, borderRadius: 1, overflow: 'hidden' }}>
              <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeView center={mapCenter} zoom={mapZoom} />
                
                {/* Маркер з місцезнаходженням користувача */}
                <LocationMarker onLocationFound={handleLocationFound} />
                
                {/* Маркери спортзалів */}
                {filteredGyms.map(gym => {
                  if (gym.location && gym.location.lat && gym.location.lng) {
                    return (
                      <Marker 
  key={gym.id}
  position={[gym.location.lat, gym.location.lng]}
  eventHandlers={{
    click: () => handleGymSelect(gym)
  }}
>
  <Popup>
    <div>
      <h3>{gym.name}</h3>
      <p>{getTypeName(gym.type)}</p>
      <p>{gym.address}</p>
      {gym.phone && <p>Тел: {gym.phone}</p>}
      {gym.distance && <p><strong>Відстань: {gym.distance.toFixed(2)} км</strong></p>}
      <Button
        variant="outlined"
        startIcon={<InfoIcon />}
        onClick={() => {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(gym.name + ' ' + gym.address)}`, '_blank');
        }}
      >
        Пошук у Google
      </Button>
    </div>
  </Popup>
</Marker>
                    );
                  }
                  return null;
                })}
                
                {/* Коло радіусу пошуку, якщо активний режим "Поблизу" */}
                {showingNearby && userLocation && (
                  <Circle 
                    center={[userLocation.lat, userLocation.lng]} 
                    radius={searchRadius * 1000} // конвертуємо км в метри
                    pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.05 }}
                  />
                )}
              </MapContainer>
            </Box>
            
            {/* Інформація про кількість знайдених спортзалів */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Знайдено спортзалів: {filteredGyms.length}
                {showingNearby && ` (в радіусі ${searchRadius} км від вас)`}
              </Typography>
              
              <Box>
                <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 1 }}>
                  Легенда:
                </Typography>
                <Chip 
                  label="Тренажерний зал" 
                  size="small" 
                  color="primary" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  label="CrossFit" 
                  size="small" 
                  color="secondary" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  label="Йога" 
                  size="small" 
                  color="success" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  label="Басейн" 
                  size="small" 
                  color="info" 
                />
              </Box>
            </Box>
            
            {/* Список спортзалів */}
            <Grid container spacing={2}>
              {filteredGyms.map((gym, index) => (
                <Grid item xs={12} md={6} lg={4} key={gym.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 6
                      }
                    }}
                    onClick={() => handleGymSelect(gym)}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={gym.imageUrl || 'https://via.placeholder.com/300x140?text=Спортзал'}
                      alt={gym.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="div" gutterBottom>
                          {gym.name}
                        </Typography>
                        <Chip 
                          label={getTypeName(gym.type)} 
                          size="small" 
                          color={getChipColorByType(gym.type)}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating 
                          value={parseFloat(gym.rating) || 0} 
                          precision={0.5} 
                          readOnly 
                          size="small" 
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({gym.reviewsCount || 0})
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <LocationIcon fontSize="small" sx={{ mr: 1, mt: 0.3 }} color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {gym.address}
                        </Typography>
                      </Box>
                      
                      {/* Відображення відстані, якщо активний режим "Поблизу" */}
                      {gym.distance && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <NearMeIcon fontSize="small" sx={{ mr: 1 }} color="primary" />
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            Відстань: {gym.distance.toFixed(2)} км
                          </Typography>
                        </Box>
                      )}
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          overflow: 'hidden',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                        }}
                      >
                        {gym.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* Бокова панель з деталями про спортзал */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': { 
            width: { xs: '100%', sm: 400 },
            maxWidth: '100%'
          },
        }}
      >
        {selectedGym && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                {selectedGym.name}
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <img 
                src={selectedGym.imageUrl || 'https://via.placeholder.com/400x200?text=Спортзал'} 
                alt={selectedGym.name}
                style={{ width: '100%', borderRadius: 8 }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating 
                value={parseFloat(selectedGym.rating) || 0} 
                precision={0.5} 
                readOnly 
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({selectedGym.reviewsCount || 0} відгуків)
              </Typography>
            </Box>
            
            {/* Відображення відстані в картці деталей */}
            {selectedGym.distance && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <NearMeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body1" color="primary" fontWeight="medium">
                  Відстань від вас: {selectedGym.distance.toFixed(2)} км
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  label={getTypeName(selectedGym.type)} 
                  color={getChipColorByType(selectedGym.type)}
                  size="small"
                />
                {selectedGym.types && selectedGym.types.map((type, typeIndex) => (
  <Chip 
    key={`type-${type}-${typeIndex}`}
    label={getTypeName(type)} 
    color={getChipColorByType(type)}
    size="small"
    variant="outlined"
  />
))}
              </Box>
            </Box>
            
            <Typography variant="body1" paragraph>
              {selectedGym.description}
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Адреса" 
                  secondary={selectedGym.address} 
                />
              </ListItem>
              
              {selectedGym.phone && (
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Телефон" 
                    secondary={
                      <a 
                        href={`tel:${selectedGym.phone}`} 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {selectedGym.phone}
                      </a>
                    } 
                  />
                </ListItem>
              )}
              
              {selectedGym.website && (
                <ListItem>
                  <ListItemIcon>
                    <WebIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Веб-сайт" 
                    secondary={
                      <a 
                        href={selectedGym.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {selectedGym.website}
                      </a>
                    } 
                  />
                </ListItem>
              )}
              
              {selectedGym.hours && (
                <ListItem>
                  <ListItemIcon>
                    <TimeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Години роботи" 
                    secondary={selectedGym.hours} 
                  />
                </ListItem>
              )}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="contained"
                startIcon={<DirectionsIcon />}
                onClick={() => handleShowDirections(selectedGym)}
                disabled={!selectedGym.location}
              >
                Прокласти маршрут
              </Button>
              
              <Button
  variant="outlined"
  startIcon={<InfoIcon />}
  onClick={() => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedGym.name + ' ' + selectedGym.address)}`, '_blank');
    setDrawerOpen(false);
  }}
>
  Пошук у Google
</Button>
            </Box>
          </Box>
        )}
      </Drawer>
      
      {/* Snackbar повідомлення */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default GymMap;