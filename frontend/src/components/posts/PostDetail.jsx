import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import CommentSection from '../comments/CommentSection';
import PostRating from '../posts/PostRating'; // Імпортуємо новий компонент
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Divider,
  Chip,
  Avatar,
  Grid,
  Skeleton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link as MuiLink,
  Breadcrumbs
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { Link } from "react-router-dom";

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    console.log("PostDetail component mounted. Post ID:", id);
    
    const fetchPost = async () => {
      try {
        console.log("Fetching post data for ID:", id);
        const postRef = doc(db, "posts", id);
        const postDoc = await getDoc(postRef);
        
        if (postDoc.exists()) {
          const postData = { id: postDoc.id, ...postDoc.data() };
          console.log("Post data retrieved successfully:", postData.title);
          setPost(postData);
        } else {
          console.error("Post does not exist");
          setError("Статтю не знайдено");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Не вдалося завантажити статтю");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    
    return () => {
      console.log("PostDetail component unmounted");
    };
  }, [id]);

  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    handleCloseDeleteDialog();
    
    try {
      const postRef = doc(db, "posts", id);
      await deleteDoc(postRef);
      navigate("/home");
    } catch (err) {
      console.error("Помилка видалення статті:", err);
      setError("Не вдалося видалити статтю");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton variant="text" sx={{ fontSize: '3rem', width: '70%', mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 1 }} />
          <Skeleton variant="text" sx={{ fontSize: '1rem', width: 120 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Skeleton variant="text" sx={{ fontSize: '1rem', width: 100 }} />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rounded" width={100} height={40} />
          <Skeleton variant="rounded" width={100} height={40} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Помилка
          </Typography>
          <Typography variant="body1">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            to="/home" 
            sx={{ mt: 2 }}
          >
            Повернутися на головну
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Статтю не знайдено
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            to="/home" 
            sx={{ mt: 2 }}
          >
            Повернутися на головну
          </Button>
        </Paper>
      </Container>
    );
  }

  const isAuthor = currentUser && post.author === currentUser.email;
  const contentToDisplay = post.contentHtml || post.content;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <Button
          component={Link}
          to="/home"
          startIcon={<HomeIcon />}
          color="inherit"
          size="small"
        >
          Головна
        </Button>
        <Typography color="text.primary">{post.title}</Typography>
      </Breadcrumbs>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {post.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 1 }}>
            <PersonIcon />
          </Avatar>
          <Typography variant="body2">
            {post.author}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {post.createdAt && new Date(post.createdAt.toDate()).toLocaleString('uk-UA')}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />

        {post.fileName && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3, 
              p: 2, 
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            <DescriptionIcon color="primary" sx={{ mr: 1 }} />
            {post.isFileUploading ? (
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Завантаження файлу...
                </Typography>
                <Box sx={{ width: '100%' }}>
                  <Box 
                    sx={{ 
                      height: 5,
                      bgcolor: 'primary.main', 
                      width: '100%', 
                      borderRadius: 5,
                      animation: 'pulse 1.5s infinite ease-in-out'
                    }}
                  />
                </Box>
              </Box>
            ) : post.fileError ? (
              <Typography variant="body2" color="error">
                Помилка завантаження файлу: {post.fileError}
              </Typography>
            ) : (
              <>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Документ:
                </Typography>
                {post.fileUrl ? (
                  <MuiLink 
                    href={post.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    download={post.fileName}
                    sx={{ flexGrow: 1 }}
                  >
                    {post.fileName}
                    <Typography variant="caption" display="block" color="text.secondary">
                      Натисніть для завантаження
                    </Typography>
                  </MuiLink>
                ) : (
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {post.fileName}
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}
        
        <Box 
          className="blog-content" 
          sx={{ 
            '& img': { 
              maxWidth: '100%', 
              height: 'auto' 
            },
            typography: 'body1'
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: contentToDisplay }} />
        </Box>
      </Paper>

      {/* Додаємо систему оцінок */}
      <PostRating postId={id} />

      {/* Кнопки управління для автора */}
      {isAuthor && (
        <Grid container spacing={2} justifyContent="center" sx={{ mb: 4 }}>
          <Grid item>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
              onClick={() => navigate(`/edit-post/${id}`)}
            >
              Редагувати
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<DeleteIcon />}
              disabled={isDeleting}
              onClick={handleOpenDeleteDialog}
            >
              {isDeleting ? "Видалення..." : "Видалити"}
            </Button>
          </Grid>
        </Grid>
      )}

      {/* Секція коментарів */}
      <CommentSection postId={id} />

      {/* Діалог підтвердження видалення */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Видалити статтю?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Ви впевнені, що хочете видалити цю статтю? Ця дія не може бути скасована.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Скасувати</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PostDetail;