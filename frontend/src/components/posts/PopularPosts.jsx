import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Skeleton,
  Chip,
  Rating
} from '@mui/material';
import { 
  Article as ArticleIcon,
  TrendingUp as TrendingUpIcon,
  StarRate as StarRateIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';

const PopularPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Отримуємо останні 5 статей (за часом створення)
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPosts(postsData);
        
        // Завантажуємо рейтинги для кожного поста
        await fetchRatingsForPosts(postsData.map(post => post.id));
        
      } catch (err) {
        console.error('Помилка отримання популярних статей:', err);
        setError('Не вдалося завантажити популярні статті');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRatingsForPosts = async (postIds) => {
      try {
        // Отримуємо дані про оцінки для кожного поста
        const ratingsData = {};
        
        for (const postId of postIds) {
          const ratingsQuery = collection(db, 'postRatings');
          const ratingsSnapshot = await getDocs(ratingsQuery);
          
          // Шукаємо документ з рейтингами для конкретного поста
          const postRatingDoc = ratingsSnapshot.docs.find(doc => doc.id === postId);
          
          if (postRatingDoc) {
            const data = postRatingDoc.data();
            ratingsData[postId] = {
              averageRating: data.averageRating || 0,
              totalRatings: data.totalRatings || 0,
              likes: data.likes?.length || 0
            };
          } else {
            ratingsData[postId] = {
              averageRating: 0,
              totalRatings: 0, 
              likes: 0
            };
          }
        }
        
        setRatings(ratingsData);
        
      } catch (err) {
        console.error('Помилка отримання рейтингів:', err);
      }
    };
    
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUpIcon sx={{ mr: 1 }} color="primary" />
          <Typography variant="h6">Популярні статті</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List disablePadding>
          {[1, 2, 3, 4, 5].map((item) => (
            <React.Fragment key={item}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="60%" />}
                  secondary={<Skeleton variant="text" width="80%" />}
                />
              </ListItem>
              {item < 5 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  // Сортуємо пости за кількістю лайків (якщо є)
  const sortedPosts = [...posts].sort((a, b) => {
    const likesA = ratings[a.id]?.likes || 0;
    const likesB = ratings[b.id]?.likes || 0;
    return likesB - likesA;
  });

  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TrendingUpIcon sx={{ mr: 1 }} color="primary" />
        <Typography variant="h6">Популярні статті</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {posts.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Поки що немає статей
        </Typography>
      ) : (
        <List disablePadding>
          {sortedPosts.map((post, index) => (
            <React.Fragment key={post.id}>
              <ListItem 
                alignItems="flex-start" 
                component={Link} 
                to={`/post/${post.id}`}
                sx={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: index === 0 ? 'error.main' : index === 1 ? 'warning.main' : 'primary.main' }}>
                    <ArticleIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography 
                        variant="subtitle1"
                        sx={{ 
                          mr: 1,
                          fontWeight: index === 0 ? 'bold' : 'normal'
                        }}
                      >
                        {post.title}
                      </Typography>
                      {index === 0 && (
                        <Chip size="small" color="error" label="ТОП" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      {/* Автор і дата */}
                      <Typography variant="body2" color="text.secondary" component="span">
                        {post.author} • {post.createdAt && new Date(post.createdAt.toDate()).toLocaleDateString('uk-UA')}
                      </Typography>
                      
                      {/* Рейтинги і лайки */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 2 }}>
                        {/* Лайки */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FavoriteIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {ratings[post.id]?.likes || 0}
                          </Typography>
                        </Box>
                        
                        {/* Рейтинг */}
                        {ratings[post.id]?.totalRatings > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Rating 
                              value={ratings[post.id]?.averageRating || 0} 
                              precision={0.5} 
                              readOnly 
                              size="small"
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                              ({ratings[post.id]?.totalRatings || 0})
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < sortedPosts.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default PopularPosts;