import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../services/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  where,
  updateDoc
} from "firebase/firestore";
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Tooltip,
  Badge,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Comment as CommentIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const AdminPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [openBlockDialog, setOpenBlockDialog] = useState(false);
  const [postToBlock, setPostToBlock] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [commentsCount, setCommentsCount] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    // Фільтрація та пошук статей
    let result = posts;

    // Фільтрація за статусом
    if (filterStatus !== "all") {
      result = result.filter(post => post.status === filterStatus);
    }

    // Пошук за терміном
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        post => 
          post.title.toLowerCase().includes(term) || 
          post.author.toLowerCase().includes(term)
      );
    }

    setFilteredPosts(result);
  }, [posts, searchTerm, filterStatus]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Отримуємо всі статті
      const postsCollection = collection(db, "posts");
      const q = query(postsCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const postsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || "active" // Встановлюємо статус за замовчуванням
      }));
      
      setPosts(postsList);
      
      // Отримуємо кількість коментарів для кожної статті
      await fetchCommentsCount(postsList.map(post => post.id));
      
    } catch (error) {
      console.error("Помилка отримання статей:", error);
      setSnackbar({
        open: true,
        message: "Помилка завантаження статей",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsCount = async (postIds) => {
    try {
      const countMap = {};
      
      // Для кожного ID статті отримуємо кількість коментарів
      for (const postId of postIds) {
        const commentsQuery = query(
          collection(db, 'comments'),
          where('postId', '==', postId)
        );
        
        const snapshot = await getDocs(commentsQuery);
        countMap[postId] = snapshot.size;
      }
      
      setCommentsCount(countMap);
    } catch (error) {
      console.error('Помилка отримання кількості коментарів:', error);
    }
  };

  const handleDeleteDialogOpen = (post) => {
    setPostToDelete(post);
    setOpenDeleteDialog(true);
  };

  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
    setPostToDelete(null);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      // Видаляємо статтю
      await deleteDoc(doc(db, "posts", postToDelete.id));
      
      // Оновлюємо стан
      setPosts(posts.filter(post => post.id !== postToDelete.id));
      
      setSnackbar({
        open: true,
        message: `Статтю "${postToDelete.title}" успішно видалено`,
        severity: "success"
      });
    } catch (error) {
      console.error("Помилка видалення статті:", error);
      setSnackbar({
        open: true,
        message: "Помилка видалення статті",
        severity: "error"
      });
    } finally {
      handleDeleteDialogClose();
    }
  };

  const handleBlockDialogOpen = (post) => {
    setPostToBlock(post);
    setOpenBlockDialog(true);
  };

  const handleBlockDialogClose = () => {
    setOpenBlockDialog(false);
    setPostToBlock(null);
  };

  const handleToggleBlockPost = async () => {
    if (!postToBlock) return;
    
    const newStatus = postToBlock.status === "blocked" ? "active" : "blocked";
    
    try {
      // Оновлюємо статус статті
      await updateDoc(doc(db, "posts", postToBlock.id), {
        status: newStatus
      });
      
      // Оновлюємо локальний стан
      setPosts(posts.map(post => 
        post.id === postToBlock.id 
          ? { ...post, status: newStatus } 
          : post
      ));
      
      setSnackbar({
        open: true,
        message: newStatus === "blocked" 
          ? `Статтю "${postToBlock.title}" заблоковано` 
          : `Статтю "${postToBlock.title}" розблоковано`,
        severity: "success"
      });
    } catch (error) {
      console.error("Помилка зміни статусу статті:", error);
      setSnackbar({
        open: true,
        message: "Помилка зміни статусу статті",
        severity: "error"
      });
    } finally {
      handleBlockDialogClose();
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Хлібні крихти */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          component="button"
          variant="body2"
          onClick={() => navigate('/admin')}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
          Адмін-панель
        </Link>
        <Typography color="text.primary">Управління статтями</Typography>
      </Breadcrumbs>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Управління статтями
          </Typography>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchPosts}
          >
            Оновити
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Фільтри та пошук */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Пошук статей"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
            }}
          />
          
          <FormControl sx={{ minWidth: '150px' }} size="small">
            <InputLabel id="status-filter-label">Статус</InputLabel>
            <Select
              labelId="status-filter-label"
              value={filterStatus}
              label="Статус"
              onChange={(e) => setFilterStatus(e.target.value)}
              startAdornment={<FilterListIcon color="action" sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">Всі статті</MenuItem>
              <MenuItem value="active">Активні</MenuItem>
              <MenuItem value="blocked">Заблоковані</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* Таблиця статей */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Назва</TableCell>
                    <TableCell>Автор</TableCell>
                    <TableCell>Дата створення</TableCell>
                    <TableCell>Коментарі</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="center">Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Статті не знайдено
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPosts.map((post) => (
                      <TableRow 
                        key={post.id}
                        sx={{ 
                          '&:hover': { bgcolor: 'action.hover' },
                          bgcolor: post.status === 'blocked' ? 'rgba(211, 47, 47, 0.04)' : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {post.title}
                          </Typography>
                        </TableCell>
                        <TableCell>{post.author}</TableCell>
                        <TableCell>
                          {post.createdAt && new Date(post.createdAt.toDate()).toLocaleString('uk-UA')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            badgeContent={commentsCount[post.id] || 0} 
                            color="primary"
                            max={99}
                          >
                            <CommentIcon color="action" />
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.status === "blocked" ? (
                            <Chip 
                              label="Заблоковано" 
                              color="error" 
                              size="small" 
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              label="Активна" 
                              color="success" 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Tooltip title="Переглянути">
                              <IconButton
                                color="primary"
                                onClick={() => navigate(`/post/${post.id}`)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Редагувати">
                              <IconButton
                                color="secondary"
                                onClick={() => navigate(`/edit-post/${post.id}`)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={post.status === "blocked" ? "Розблокувати" : "Заблокувати"}>
                              <IconButton
                                color={post.status === "blocked" ? "success" : "warning"}
                                onClick={() => handleBlockDialogOpen(post)}
                              >
                                {post.status === "blocked" ? <CheckCircleIcon /> : <BlockIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Видалити">
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteDialogOpen(post)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Статистика відфільтрованих статей */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="body2" color="text.secondary">
                Показано статей: {filteredPosts.length} з {posts.length}
              </Typography>
            </Box>
          </>
        )}
      </Paper>
      
      {/* Діалог підтвердження видалення */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Видалити статтю?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ви впевнені, що хочете видалити статтю "{postToDelete?.title}"? Ця дія не може бути скасована.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Скасувати</Button>
          <Button onClick={handleDeletePost} color="error" variant="contained">
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Діалог підтвердження блокування/розблокування */}
      <Dialog
        open={openBlockDialog}
        onClose={handleBlockDialogClose}
      >
        <DialogTitle>
          {postToBlock?.status === "blocked" ? "Розблокувати статтю?" : "Заблокувати статтю?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {postToBlock?.status === "blocked" 
              ? `Ви впевнені, що хочете розблокувати статтю "${postToBlock?.title}"? Вона стане доступною для всіх користувачів.` 
              : `Ви впевнені, що хочете заблокувати статтю "${postToBlock?.title}"? Вона буде прихована від звичайних користувачів.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBlockDialogClose}>Скасувати</Button>
          <Button 
            onClick={handleToggleBlockPost} 
            color={postToBlock?.status === "blocked" ? "success" : "warning"} 
            variant="contained"
          >
            {postToBlock?.status === "blocked" ? "Розблокувати" : "Заблокувати"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar для повідомлень */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPosts;