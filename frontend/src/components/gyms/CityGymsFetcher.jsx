import React, { useState } from 'react';
import { db } from "../../services/firebase";
import { collection, getDocs, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
  CardMedia,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  MenuItem
} from '@mui/material';

// Інструмент для отримання даних про спортзали у різних містах та додавання їх до Firebase
const CityGymsFetcher = () => {
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [gyms, setGyms] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [city, setCity] = useState('Львів');
  const [cityCoordinates, setCityCoordinates] = useState({ lat: 49.8397, lng: 24.0297 });
  
  // Типи спортзалів для пошуку картинки
  const typeToImageKeyword = {
    gym: 'gym',
    fitness: 'fitness',
    yoga: 'yoga',
    swimming: 'swimming pool',
    crossfit: 'crossfit',
    boxing: 'boxing gym',
    'martial_arts': 'martial arts',
    dance: 'dance studio',
    'table_tennis': 'table tennis',
    tennis: 'tennis court',
    default: 'fitness'
  };

  // Функція для отримання зображення на основі типу спортзалу
  const getUnsplashImage = (keyword) => {
    // База локальних зображень
    const imageMap = {
      'gym': 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg',
      'yoga': 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg',
      'pool': 'https://images.pexels.com/photos/261327/pexels-photo-261327.jpeg',
      'martial_arts': 'https://images.pexels.com/photos/260447/pexels-photo-260447.jpeg',
      'dance': 'https://images.pexels.com/photos/3998439/pexels-photo-3998439.jpeg',
      'tennis': 'https://images.pexels.com/photos/2202685/pexels-photo-2202685.jpeg',
      'table_tennis': 'https://images.pexels.com/photos/4866075/pexels-photo-4866075.jpeg',
      'crossfit': 'https://images.pexels.com/photos/28080/pexels-photo.jpg',
      'default': 'https://images.pexels.com/photos/416754/pexels-photo-416754.jpeg'
    };
    
    const searchTerm = typeToImageKeyword[keyword] || typeToImageKeyword.default;
    return imageMap[searchTerm] || imageMap['default'];
  };

  // Визначення типу спортзалу на основі тегів
  const determineGymType = (tags) => {
    if (tags.sport === 'fitness' || tags.leisure === 'fitness_centre' || tags.amenity === 'gym') {
      return 'gym';
    } else if (tags.sport === 'yoga') {
      return 'yoga';
    } else if (tags.sport === 'swimming') {
      return 'pool';
    } else if (tags.sport === 'boxing') {
      return 'martial_arts';
    } else if (tags.sport === 'martial_arts') {
      return 'martial_arts';
    } else if (tags.sport === 'dancing' || tags.leisure === 'dance') {
      return 'dance';
    } else if (tags.sport === 'table_tennis') {
      return 'table_tennis';
    } else if (tags.sport === 'tennis') {
      return 'tennis';
    } else if (tags.sport === 'fitness') {
      return 'gym';
    } else {
      return 'gym'; // за замовчуванням
    }
  };

  // Функція для отримання даних про спортзали через Overpass API
  const fetchCityGyms = async () => {
    setLoading(true);
    setError(null);
    setFetched(false);
    setGyms([]);
    
    try {
      // Запит до Overpass API для пошуку спортзалів у радіусі 10 км від центру міста
      const query = `
        [out:json];
        (
          node["leisure"="fitness_centre"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          way["leisure"="fitness_centre"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          node["amenity"="gym"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          way["amenity"="gym"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          node["sport"="fitness"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          way["sport"="fitness"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          node["sport"="yoga"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          way["sport"="yoga"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          node["sport"="swimming"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          way["sport"="swimming"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          node["sport"="martial_arts"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          way["sport"="martial_arts"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          node["sport"="boxing"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          way["sport"="boxing"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          node["sport"="dancing"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
          way["sport"="dancing"](around:10000,${cityCoordinates.lat},${cityCoordinates.lng});
        );
        out body;
        out center;
      `;
      
      // Виконання запиту
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      );
      
      const data = await response.json();
      
      if (data && data.elements) {
        console.log(`Знайдено ${data.elements.length} спортзалів у місті ${city}`);
        
        // Обробка отриманих даних
        const processedGyms = data.elements
          .filter(element => element.tags && element.tags.name) // тільки з назвою
          .map(element => {
            // Визначення координат
            let lat, lng;
            if (element.type === 'node') {
              lat = element.lat;
              lng = element.lon;
            } else if (element.type === 'way' && element.center) {
              lat = element.center.lat;
              lng = element.center.lon;
            } else {
              return null; // пропускаємо елементи без координат
            }
            
            // Визначення типу спортзалу
            const gymType = determineGymType(element.tags);
            
            // Формування адреси
            let address = '';
            if (element.tags["addr:street"]) {
              address += element.tags["addr:street"];
              if (element.tags["addr:housenumber"]) {
                address += ", " + element.tags["addr:housenumber"];
              }
              address += ", " + city;
            } else {
              address = city;
            }
            
            // Отримання зображення
            const imageUrl = getUnsplashImage(gymType);
            
            // Формування об'єкта спортзалу
            return {
              id: element.id.toString(),
              name: element.tags.name,
              city: city, // Додаємо місто
              type: gymType,
              types: [gymType],
              description: element.tags.description || `${element.tags.name} - спортзал у місті ${city}`,
              address: address,
              location: { lat, lng },
              phone: element.tags.phone || element.tags["contact:phone"] || "+380322000000",
              website: element.tags.website || element.tags["contact:website"] || null,
              hours: element.tags.opening_hours || "Пн-Пт: 8:00-22:00, Сб-Нд: 9:00-20:00",
              imageUrl: imageUrl,
              rating: (Math.random() * 2 + 3).toFixed(1), // Випадковий рейтинг від 3 до 5
              reviewsCount: Math.floor(Math.random() * 50) + 5 // Випадкова кількість відгуків від 5 до 55
            };
          })
          .filter(Boolean); // Видалення null значень
        
        setGyms(processedGyms);
        setFetched(true);
      } else {
        setError("Не вдалося знайти спортзали або отриманий порожній результат");
      }
    } catch (err) {
      console.error("Помилка отримання даних:", err);
      setError(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Функція для додавання отриманих даних до Firebase
  // Змінюємо цю функцію в CityGymsFetcher.jsx
// Модифікуємо функцію addGymsToFirebase для перевірки дублікатів
    // Змініть функцію addGymsToFirebase, щоб покращити виявлення дублікатів
    const addGymsToFirebase = async () => {
        if (gyms.length === 0) {
          setError("Немає даних для додавання до бази даних");
          return;
        }
        
        setLoading(true);
        setError(null);
        setSuccess(false);
        
        try {
          // Отримуємо поточні спортзали для перевірки дублікатів
          const gymsCollection = collection(db, 'gyms');
          const existingGymsSnapshot = await getDocs(gymsCollection);
          
          // Створюємо Set унікальних адрес спортзалів
          const existingAddressesSet = new Set();
          
          existingGymsSnapshot.forEach(doc => {
            const gymData = doc.data();
            // Використовуємо ТІЛЬКИ адресу як унікальний ідентифікатор і приводимо до нижнього регістру
            if (gymData.address) {
              const normalizedAddress = gymData.address.toLowerCase().trim();
              existingAddressesSet.add(normalizedAddress);
            }
          });
          
          console.log(`Знайдено ${existingAddressesSet.size} унікальних адрес спортзалів у базі даних`);
          
          // Фільтруємо дублікати за адресою
          const newGyms = [];
          const duplicateGyms = [];
          
          gyms.forEach(gym => {
            if (gym.address) {
              const normalizedAddress = gym.address.toLowerCase().trim();
              if (!existingAddressesSet.has(normalizedAddress)) {
                newGyms.push(gym);
                // Додаємо адресу до множини, щоб запобігти дублікатам навіть в межах поточного набору
                existingAddressesSet.add(normalizedAddress);
              } else {
                duplicateGyms.push(gym);
              }
            } else {
              // Якщо немає адреси, вважаємо новим залом
              newGyms.push(gym);
            }
          });
          
          console.log(`З ${gyms.length} спортзалів, ${newGyms.length} нових і ${duplicateGyms.length} дублікатів за адресою`);
          
          if (newGyms.length === 0) {
            setError("Усі спортзали з цими адресами вже існують у базі даних");
            setLoading(false);
            return;
          }
          
          // Додаємо лише нові зали
          const batch = writeBatch(db);
          
          for (const gym of newGyms) {
            // Генеруємо новий docRef для кожного спортзалу
            const docRef = doc(gymsCollection);
            batch.set(docRef, {
              ...gym,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
          
          // Виконання batch
          await batch.commit();
          setSuccess(true);
          const successMessage = `Додано ${newGyms.length} нових спортзалів. Пропущено ${duplicateGyms.length} дублікатів (зали з тією ж адресою).`;
          setSnackbarMessage(successMessage);
          setSnackbarOpen(true);
          console.log(successMessage);
        } catch (err) {
          console.error("Помилка додавання даних:", err);
          setError(`Помилка: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };  
  // Додамо стан для сповіщень на початку компонента
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // В кінці повернення JSX додамо Snackbar
  <Snackbar
    open={snackbarOpen}
    autoHideDuration={6000}
    onClose={() => setSnackbarOpen(false)}
    message={snackbarMessage}
  />

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Отримання даних про спортзали
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Місто</InputLabel>
          <Select
            value={city}
            label="Місто"
            onChange={(e) => {
              setCity(e.target.value);
              // Змінюємо координати відповідно до вибраного міста
              switch(e.target.value) {
                case 'Київ':
                  setCityCoordinates({ lat: 50.4501, lng: 30.5234 });
                  break;
                case 'Львів':
                  setCityCoordinates({ lat: 49.8397, lng: 24.0297 });
                  break;
                case 'Одеса':
                  setCityCoordinates({ lat: 46.4825, lng: 30.7233 });
                  break;
                case 'Харків':
                  setCityCoordinates({ lat: 49.9935, lng: 36.2304 });
                  break;
                case 'Дніпро':
                  setCityCoordinates({ lat: 48.4647, lng: 35.0462 });
                  break;
                default:
                  setCityCoordinates({ lat: 49.8397, lng: 24.0297 });
              }
            }}
          >
            <MenuItem value="Львів">Львів</MenuItem>
            <MenuItem value="Київ">Київ</MenuItem>
            <MenuItem value="Одеса">Одеса</MenuItem>
            <MenuItem value="Харків">Харків</MenuItem>
            <MenuItem value="Дніпро">Дніпро</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="body1" paragraph>
          Цей інструмент отримує дані про спортзали у вибраному місті з OpenStreetMap 
          та додає їх до вашої бази даних Firebase.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Дані успішно додано! Додано {gyms.length} спортзалів до бази даних.
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchCityGyms}
            disabled={loading}
          >
            {loading && !fetched ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                Отримання даних...
              </>
            ) : (
              'Отримати дані про спортзали'
            )}
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            onClick={addGymsToFirebase}
            disabled={loading || !fetched || gyms.length === 0}
          >
            {loading && fetched ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                Додавання до бази...
              </>
            ) : (
              'Додати до Firebase'
            )}
          </Button>
        </Box>
        
        {fetched && gyms.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Знайдено {gyms.length} спортзалів у місті {city}
            </Typography>
            
            <Box sx={{ mt: 2, mb: 3 }}>
              <Grid container spacing={2}>
                {gyms.slice(0, 6).map((gym) => (
                  <Grid item xs={12} sm={6} md={4} key={gym.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={gym.imageUrl}
                        alt={gym.name}
                      />
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {gym.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {gym.address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Тип: {getTypeLabel(gym.type)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {gyms.length > 6 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  ...і ще {gyms.length - 6} спортзалів
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Paper>
      <Snackbar
      open={snackbarOpen}
      autoHideDuration={6000}
      onClose={() => setSnackbarOpen(false)}
      message={snackbarMessage}
    />
    </Container>
  );
};

// Функція для перекладу типу спортзалу
const getTypeLabel = (type) => {
  switch (type) {
    case 'gym': return 'Тренажерний зал';
    case 'yoga': return 'Йога';
    case 'pool': return 'Басейн';
    case 'martial_arts': return 'Бойові мистецтва';
    case 'dance': return 'Танці';
    case 'table_tennis': return 'Настільний теніс';
    case 'tennis': return 'Теніс';
    default: return type;
  }
};

export default CityGymsFetcher;