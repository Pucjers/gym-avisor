import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Tooltip, 
  Paper,
  Rating, 
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  setDoc, 
  increment,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../services/firebase';

const PostRating = ({ postId }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  // Завантаження даних оцінок
  useEffect(() => {
    if (!postId) {
      setError("Не вказано ID поста");
      setLoading(false);
      return;
    }

    console.log("Завантаження даних оцінок для поста:", postId);
    
    // Посилання на документ оцінок
    const ratingsRef = doc(db, 'postRatings', postId);
    
    // Підписка на оновлення даних оцінок в реальному часі
    const unsubscribe = onSnapshot(ratingsRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        console.log("Отримано дані оцінок:", data);
        
        // Оновлюємо стан на основі отриманих даних
        setAverageRating(data.averageRating || 0);
        setTotalRatings(data.totalRatings || 0);
        setLikesCount(data.likes?.length || 0);
        
        // Перевіряємо, чи поточний користувач поставив лайк
        if (currentUser && data.likes && data.likes.includes(currentUser.uid)) {
          setLiked(true);
        } else {
          setLiked(false);
        }
        
        // Знаходимо оцінку поточного користувача
        if (currentUser && data.ratings) {
          const userRatingData = data.ratings.find(
            rating => rating.userId === currentUser.uid
          );
          if (userRatingData) {
            setUserRating(userRatingData.rating);
          } else {
            setUserRating(0);
          }
        }
      } else {
        console.log("Документ оцінок не існує, створюємо новий");
        // Нульові значення за замовчуванням, якщо документа немає
        setAverageRating(0);
        setTotalRatings(0);
        setLikesCount(0);
        setUserRating(0);
        setLiked(false);
      }
      
      setLoading(false);
    }, (err) => {
      console.error("Помилка отримання даних оцінок:", err);
      setError(`Не вдалося завантажити оцінки: ${err.message}`);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [postId, currentUser]);
  
  // Обробник для зірочок (рейтингу)
  const handleRatingChange = async (event, newValue) => {
    if (!currentUser) {
      setError("Увійдіть, щоб оцінити статтю");
      return;
    }
    
    try {
      setLoading(true);
      const ratingsRef = doc(db, 'postRatings', postId);
      
      // Перевіряємо, чи існує документ з оцінками
      const ratingsDoc = await getDoc(ratingsRef);
      
      if (ratingsDoc.exists()) {
        const data = ratingsDoc.data();
        const ratings = data.ratings || [];
        
        // Шукаємо, чи користувач вже оцінював статтю
        const userRatingIndex = ratings.findIndex(
          rating => rating.userId === currentUser.uid
        );
        
        let updatedRatings;
        let newAverageRating;
        let newTotalRatings = data.totalRatings || 0;
        
        if (userRatingIndex !== -1) {
          // Оновлюємо існуючу оцінку
          const oldRating = ratings[userRatingIndex].rating;
          updatedRatings = [...ratings];
          updatedRatings[userRatingIndex] = {
            userId: currentUser.uid,
            rating: newValue,
            timestamp: new Date()
          };
          
          // Перераховуємо середню оцінку
          const totalSum = data.averageRating * newTotalRatings;
          const newSum = totalSum - oldRating + newValue;
          newAverageRating = newSum / newTotalRatings;
        } else {
          // Додаємо нову оцінку
          updatedRatings = [
            ...ratings,
            {
              userId: currentUser.uid,
              rating: newValue,
              timestamp: new Date()
            }
          ];
          
          // Перераховуємо середню оцінку
          newTotalRatings += 1;
          const totalSum = (data.averageRating || 0) * (data.totalRatings || 0);
          const newSum = totalSum + newValue;
          newAverageRating = newSum / newTotalRatings;
        }
        
        // Оновлюємо документ
        await updateDoc(ratingsRef, {
          ratings: updatedRatings,
          averageRating: newAverageRating,
          totalRatings: newTotalRatings,
          lastUpdated: new Date()
        });
      } else {
        // Створюємо новий документ
        await setDoc(ratingsRef, {
          ratings: [{
            userId: currentUser.uid,
            rating: newValue,
            timestamp: new Date()
          }],
          averageRating: newValue,
          totalRatings: 1,
          likes: [],
          lastUpdated: new Date()
        });
      }
      
      // Оновлюємо локальний стан
      setUserRating(newValue);
      
    } catch (err) {
      console.error("Помилка при додаванні оцінки:", err);
      setError(`Не вдалося додати оцінку: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обробник для лайків
  const handleLikeToggle = async () => {
    if (!currentUser) {
      setError("Увійдіть, щоб оцінити статтю");
      return;
    }
    
    try {
      setLoading(true);
      const ratingsRef = doc(db, 'postRatings', postId);
      
      // Перевіряємо, чи існує документ з оцінками
      const ratingsDoc = await getDoc(ratingsRef);
      
      if (ratingsDoc.exists()) {
        // Якщо поточний стан "лайкнуто", прибираємо лайк
        if (liked) {
          await updateDoc(ratingsRef, {
            likes: arrayRemove(currentUser.uid),
            lastUpdated: new Date()
          });
        } else {
          // Інакше додаємо лайк
          await updateDoc(ratingsRef, {
            likes: arrayUnion(currentUser.uid),
            lastUpdated: new Date()
          });
        }
      } else {
        // Створюємо новий документ
        await setDoc(ratingsRef, {
          likes: [currentUser.uid],
          averageRating: 0,
          totalRatings: 0,
          ratings: [],
          lastUpdated: new Date()
        });
      }
      
      // Оновлюємо локальний стан
      setLiked(!liked);
      setLikesCount(prevCount => liked ? prevCount - 1 : prevCount + 1);
      
    } catch (err) {
      console.error("Помилка при зміні стану лайку:", err);
      setError(`Не вдалося поставити лайк: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Секція з лайками */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={currentUser ? (liked ? "Прибрати лайк" : "Подобається") : "Увійдіть, щоб оцінити"}>
            <span>
              <IconButton 
                color="primary"
                onClick={handleLikeToggle}
                disabled={!currentUser}
                size="large"
              >
                {liked ? (
                  <FavoriteIcon sx={{ color: 'error.main' }} />
                ) : (
                  <FavoriteBorderIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>
          
          <Typography variant="body2" color="text.secondary">
            {likesCount} {likesCount === 1 ? 'вподобання' : 'вподобань'}
          </Typography>
        </Box>
        
        {/* Секція з рейтингом */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2">
            Оцініть статтю: 
          </Typography>
          
          <Rating
            name="post-rating"
            value={userRating}
            onChange={handleRatingChange}
            precision={1}
            disabled={!currentUser}
            icon={<StarIcon fontSize="inherit" />}
            emptyIcon={<StarBorderIcon fontSize="inherit" />}
          />
          
          {totalRatings > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({averageRating.toFixed(1)}, {totalRatings} {totalRatings === 1 ? 'оцінка' : 'оцінок'})
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default PostRating;