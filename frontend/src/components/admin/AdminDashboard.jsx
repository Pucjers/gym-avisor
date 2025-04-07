import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Divider,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  Warning as WarningIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';

// Компонент для відображення статистики
const StatsCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          backgroundColor: `${color}.light`, 
          p: 1, 
          borderRadius: 1, 
          display: 'flex', 
          mr: 2 
        }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalComments: 0,
    newPostsToday: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchTotalPosts(),
          fetchTotalUsers(),
          fetchTotalComments(),
          fetchNewPostsToday(),
          fetchRecentPosts(),
          fetchRecentUsers()
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Optionally set an error state to display to the user
      } finally {
        setLoading(false);
      }
    };

    // Отримання загальної кількості статей
    const fetchTotalPosts = async () => {
      const postsCollection = collection(db, "posts");
      const postsSnapshot = await getDocs(postsCollection);
      setStats(prev => ({ ...prev, totalPosts: postsSnapshot.size }));
    };

    // Отримання загальної кількості користувачів
    const fetchTotalUsers = async () => {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      setStats(prev => ({ ...prev, totalUsers: usersSnapshot.size }));
    };

    // Отримання загальної кількості коментарів
    const fetchTotalComments = async () => {
      const commentsCollection = collection(db, "comments");
      const commentsSnapshot = await getDocs(commentsCollection);
      setStats(prev => ({ ...prev, totalComments: commentsSnapshot.size }));
    };

    // Отримання кількості нових статей за сьогодні
    const fetchNewPostsToday = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const postsCollection = collection(db, "posts");
      const q = query(
        postsCollection,
        where("createdAt", ">=", Timestamp.fromDate(today))
      );
      const postsSnapshot = await getDocs(q);
      setStats(prev => ({ ...prev, newPostsToday: postsSnapshot.size }));
    };

    // Отримання останніх статей
    const fetchRecentPosts = async () => {
      const postsCollection = collection(db, "posts");
      const q = query(
        postsCollection,
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const postsSnapshot = await getDocs(q);
      
      const postsData = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRecentPosts(postsData);
    };

    // Отримання останніх користувачів
    const fetchRecentUsers = async () => {
      const usersCollection = collection(db, "users");
      const q = query(
        usersCollection,
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const usersSnapshot = await getDocs(q);
      
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRecentUsers(usersData);
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Завантаження даних для адміністративної панелі...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Адміністративна панель
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Ласкаво просимо, {currentUser?.displayName || currentUser?.email}! Тут ви можете керувати блог-платформою.
        </Typography>
        <Divider sx={{ my: 2 }} />
      </Box>

      {/* Картки статистики */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <StatsCard 
            title="Всього статей" 
            value={stats.totalPosts} 
            icon={<ArticleIcon sx={{ color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatsCard 
            title="Користувачів" 
            value={stats.totalUsers} 
            icon={<PeopleIcon sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatsCard 
            title="Коментарі" 
            value={stats.totalComments} 
            icon={<CommentIcon sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatsCard 
            title="Нові статті сьогодні" 
            value={stats.newPostsToday} 
            icon={<BarChartIcon sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Кнопки швидких дій */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/admin/posts')}
            startIcon={<ArticleIcon />}
          >
            Керувати статтями
          </Button>
        </Grid>
        <Grid item>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => navigate('/admin/users')}
            startIcon={<PeopleIcon />}
          >
            Керувати користувачами
          </Button>
        </Grid>
        <Grid item>
          <Button 
            variant="contained" 
            color="info"
            onClick={() => navigate('/admin/comments')}
            startIcon={<CommentIcon />}
          >
            Керувати коментарями
          </Button>
        </Grid>
      </Grid>

      {/* Останні активності */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Останні статті" icon={<ArticleIcon />} iconPosition="start" />
            <Tab label="Нові користувачі" icon={<PersonIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <>
            {recentPosts.length === 0 ? (
              <Alert severity="info">Статті відсутні</Alert>
            ) : (
              <List>
                {recentPosts.map((post) => (
                  <React.Fragment key={post.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <ArticleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={post.title}
                        secondary={`Автор: ${post.author} • ${post.createdAt && new Date(post.createdAt.toDate()).toLocaleString('uk-UA')}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          onClick={() => navigate(`/post/${post.id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}

        {activeTab === 1 && (
          <>
            {recentUsers.length === 0 ? (
              <Alert severity="info">Користувачі відсутні</Alert>
            ) : (
              <List>
                {recentUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={user.photoURL}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.displayName || user.email}
                        secondary={`Роль: ${user.role || 'користувач'} • Зареєстрований: ${user.createdAt && new Date(user.createdAt.toDate ? user.createdAt.toDate() : user.createdAt).toLocaleString('uk-UA')}`}
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default AdminDashboard;