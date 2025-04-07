import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { db } from "../../services/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import PopularPosts from "../posts/PopularPosts"; // Імпортуємо новий компонент
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Box,
  Fab,
  Divider,
  Skeleton,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Person as PersonIcon,
  Comment as CommentIcon 
} from '@mui/icons-material';

const Home = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsCount, setCommentsCount] = useState({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsCollection = collection(db, "posts");
        const q = query(postsCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const postsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsList);
      } catch (error) {
        console.error("Помилка отримання постів:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Додано ефект для отримання кількості коментарів
  useEffect(() => {
    const fetchCommentsCount = async () => {
      if (posts.length === 0) return;
      
      try {
        const countMap = {};
        
        // Отримуємо кількість коментарів для кожного поста
        for (const post of posts) {
          const commentsQuery = query(
            collection(db, 'comments'),
            where('postId', '==', post.id)
          );
          
          const snapshot = await getDocs(commentsQuery);
          countMap[post.id] = snapshot.size;
        }
        
        setCommentsCount(countMap);
      } catch (error) {
        console.error('Помилка отримання кількості коментарів:', error);
      }
    };
    
    fetchCommentsCount();
  }, [posts]);

  const renderSkeletons = () => {
    return Array(3).fill().map((_, i) => (
      <Grid item xs={12} md={6} lg={4} key={`skeleton-${i}`}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" sx={{ fontSize: '2rem', width: '60%', mb: 1 }} />
            <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 0.5 }} />
            <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 0.5 }} />
            <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 0.5 }} />
            <Skeleton variant="text" sx={{ fontSize: '1rem', width: '80%' }} />
          </CardContent>
          <CardActions>
            <Skeleton variant="rounded" width={100} height={36} />
          </CardActions>
        </Card>
      </Grid>
    ));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Вітаємо у блог-платформі
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          {currentUser 
            ? `Вітаємо, ${currentUser.displayName || currentUser.email}! Перегляньте останні статті або створіть свою.` 
            : "Приєднуйтесь до нашої спільноти, щоб ділитися своїми історіями та думками."
          }
        </Typography>
        <Divider sx={{ my: 2 }} />
      </Box>

      <Grid container spacing={4}>
        {/* Основний контент - статті */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom>
            Останні статті
          </Typography>
          
          {loading ? (
            <Grid container spacing={3}>
              {renderSkeletons()}
            </Grid>
          ) : posts.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1">Поки що немає статей. Будьте першим, хто створить статтю!</Typography>
              {currentUser && (
                <Button 
                  component={Link} 
                  to="/create-post" 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  startIcon={<AddIcon />}
                >
                  Створити статтю
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={3}>
              {posts.map((post) => (
                <Grid item xs={12} md={6} key={post.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    }
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        <Link 
                          to={`/post/${post.id}`} 
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {post.title}
                        </Link>
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          {post.author}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {post.content && typeof post.content === 'string' 
                          ? post.content.replace(/<[^>]*>/g, '').slice(0, 150) + '...' 
                          : ''}
                      </Typography>
                      {post.fileName && (
                        <Chip 
                          size="small" 
                          label={post.fileName} 
                          variant="outlined" 
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        component={Link} 
                        to={`/post/${post.id}`} 
                        size="small" 
                        color="primary"
                      >
                        Читати далі
                      </Button>
                      <Box sx={{ flexGrow: 1 }} />
                      {/* Додано відображення кількості коментарів */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 2 }}>
                        <CommentIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {commentsCount[post.id] || 0}
                        </Typography>
                      </Box>
                      {post.createdAt && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(post.createdAt.toDate()).toLocaleDateString('uk-UA')}
                        </Typography>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
        
        {/* Бокова панель - популярні статті */}
        <Grid item xs={12} md={4}>
          <PopularPosts />
          
          {/* Тут можна додати інші віджети для бокової панелі */}
        </Grid>
      </Grid>
      
      {currentUser && (
        <Fab 
          color="primary" 
          aria-label="add" 
          component={Link}
          to="/create-post"
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)',
            }
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default Home;