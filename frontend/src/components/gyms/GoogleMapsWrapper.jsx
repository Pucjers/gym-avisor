// Інструкція з інтеграції Google Maps API до вашого React проекту

// 1. Отримайте API ключ для Google Maps
// - Перейдіть на Google Cloud Platform: https://console.cloud.google.com/
// - Створіть новий проект або виберіть існуючий
// - Активуйте Google Maps JavaScript API та Places API
// - Створіть ключ API з обмеженнями для вашого домену

// 2. Додайте Google Maps JavaScript API до index.html вашого проекту
// Відкрийте файл public/index.html і додайте наступний скрипт перед закриваючим тегом </body>:

/*
<script 
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places" 
  async 
  defer
></script>
*/

// Замініть YOUR_API_KEY на ваш справжній ключ API

// 3. Створіть компонент-обгортку для Google Maps
// Цей компонент перевірятиме, чи завантажено Google Maps API

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';

const GoogleMapsWrapper = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps) {
        setLoading(false);
      } else {
        // Якщо Google Maps API ще не завантажено, перевіряємо через інтервал
        setTimeout(checkGoogleMapsLoaded, 100);
      }
    };

    // Обробник помилки, якщо Google Maps не вдається завантажити
    const handleScriptError = () => {
      setError("Не вдалося завантажити Google Maps API. Перевірте з'єднання з інтернетом або API ключ.");
      setLoading(false);
    };

    // Перевірка, чи скрипт Google Maps вже додано до сторінки
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    
    if (!existingScript) {
      // Якщо скрипт ще не додано, додаємо його програмно
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onerror = handleScriptError;
      document.body.appendChild(script);
    }

    // Перевіряємо, чи Google Maps API вже завантажено
    checkGoogleMapsLoaded();

    // Очищення при демонтажі компонента
    return () => {
      // Не видаляємо скрипт, оскільки він може використовуватися іншими компонентами
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Завантаження Google Maps...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};

export default GoogleMapsWrapper;

// 4. Оновіть ваш GymMap.jsx компонент, щоб використовувати обгортку
// Приклад використання:

/*
import GoogleMapsWrapper from './GoogleMapsWrapper';

const GymMapPage = () => {
  return (
    <GoogleMapsWrapper>
      <GymMap />
    </GoogleMapsWrapper>
  );
};

export default GymMapPage;
*/

// 5. Зробіть відповідні зміни в App.js
// Замініть компонент GymMap на GymMapPage

// Примітка: Для зручності розробки додаткові маркери та іконки для карти
// Ви можете створити прості SVG іконки або скористатися бібліотекою, 
// наприклад, @googlemaps/markerclusterer для групування маркерів.

// Також зверніть увагу, що використання API Google Maps може бути платним, 
// якщо ви перевищите безкоштовні ліміти. Перегляньте актуальну інформацію про ціни
// на сайті Google Cloud Platform.