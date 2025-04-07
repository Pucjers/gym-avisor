import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box, 
  Typography, 
  Divider, 
  CircularProgress, 
  Paper, 
  TextField, 
  Button, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Alert
} from '@mui/material';
import { 
  ChatBubbleOutline as CommentIcon,
  Send as SendIcon
} from '@mui/icons-material';

// Компонент об'єднує і CommentForm, і CommentList для спрощення
const CommentSection = ({ postId }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState(null);

  // Виведемо інформацію про ID поста для діагностики
  useEffect(() => {
    console.log("CommentSection mounted with postId:", postId);
    console.log("Current user:", currentUser ? currentUser.email : "not logged in");
    
    return () => {
      console.log("CommentSection unmounted");
    };
  }, [postId, currentUser]);

  // Завантаження коментарів
  useEffect(() => {
    if (!postId) {
      console.error("Не вказано ID поста для коментарів");
      setLoading(false);
      setError("Не вдалося завантажити коментарі: відсутній ID поста");
      return;
    }

    console.log(`Початок завантаження коментарів для поста ${postId}`);
    
    try {
      // Створюємо запит для отримання коментарів - БЕЗ СОРТУВАННЯ, поки індекс не створено
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId)
        // Закоментуйте наступний рядок, поки індекс не створено
        // orderBy('createdAt', 'desc')
      );
      
      console.log("Запит створено, підписуємось на оновлення...");
      
      // Підписуємося на оновлення коментарів
      const unsubscribe = onSnapshot(
        commentsQuery,
        (snapshot) => {
          console.log(`Отримано ${snapshot.docs.length} коментарів`);
          // Отримуємо дані і сортуємо на стороні клієнта
          const commentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Сортуємо коментарі на стороні клієнта (за часом створення - нові вгорі)
          const sortedComments = commentsData.sort((a, b) => {
            // Обробка випадку, коли createdAt може бути відсутнім
            if (!a.createdAt) return 1;  // a переміщається вниз
            if (!b.createdAt) return -1; // b переміщається вниз
            
            // Конвертуємо timestamp у дату для порівняння
            const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            
            return dateB - dateA; // Зворотнє сортування - нові вгорі
          });
          
          setComments(sortedComments);
          setLoading(false);
        },
        (err) => {
          console.error('Помилка отримання коментарів:', err);
          setError(`Не вдалося завантажити коментарі: ${err.message}`);
          setLoading(false);
        }
      );
      
      // Відписка від оновлень при демонтажі компонента
      return () => {
        console.log("Відписка від оновлень коментарів");
        unsubscribe();
      };
      
    } catch (err) {
      console.error("Помилка при налаштуванні підписки на коментарі:", err);
      setError(`Помилка системи коментарів: ${err.message}`);
      setLoading(false);
    }
  }, [postId]);

  // Додавання нового коментаря
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      return;
    }
    
    if (!currentUser) {
      setCommentError('Увійдіть, щоб залишити коментар');
      return;
    }
    
    if (!postId) {
      setCommentError('Неможливо додати коментар: ID статті відсутній');
      return;
    }
    
    setIsSubmitting(true);
    setCommentError(null);
    
    try {
      console.log(`Додавання коментаря для поста ${postId} від ${currentUser.email}`);
      
      // Створюємо об'єкт коментаря
      const newComment = {
        postId,
        content: comment.trim(),
        author: currentUser.email,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email.split('@')[0],
        createdAt: serverTimestamp()
      };
      
      // Додаємо до бази даних
      const docRef = await addDoc(collection(db, 'comments'), newComment);
      console.log("Коментар успішно додано з ID:", docRef.id);
      
      // Додаємо коментар до локального стану для миттєвого відображення
      const localComment = {
        ...newComment,
        id: docRef.id,
        // Локальна версія timestamp для відображення
        createdAt: { toDate: () => new Date() }
      };
      
      // Додаємо новий коментар на початок масиву (нові вгорі)
      setComments(prevComments => [localComment, ...prevComments]);
      
      // Очищаємо форму
      setComment('');
      
    } catch (err) {
      console.error('Помилка додавання коментаря:', err);
      setCommentError(`Не вдалося додати коментар: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI під час завантаження
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Форматування дати з обробкою помилок
  const formatDate = (timestamp) => {
    if (!timestamp) return "щойно";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      // Простіший формат дати без зовнішньої бібліотеки
      return new Date(date).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Помилка форматування дати:", error);
      return "невідома дата";
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CommentIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="h2">
          Коментарі ({comments.length})
        </Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />
      
      {/* Відображення помилки завантаження коментарів, якщо є */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Форма коментаря */}
      {currentUser ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {currentUser.email.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box component="form" onSubmit={handleSubmitComment} sx={{ flexGrow: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Додайте коментар..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                margin="normal"
                variant="outlined"
                size="small"
              />
              
              {commentError && (
                <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
                  {commentError}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  endIcon={<SendIcon />}
                  disabled={isSubmitting || !comment.trim()}
                >
                  {isSubmitting ? 'Надсилання...' : 'Коментувати'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Увійдіть, щоб залишити коментар
          </Typography>
        </Paper>
      )}
      
      {/* Список коментарів */}
      {!error && comments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Коментарів поки немає. Будьте першим, хто прокоментує!
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ mb: 3 }}>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {comments.map((comment, index) => (
              <React.Fragment key={comment.id || index}>
                <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {(comment.authorName || comment.author || '?').charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" component="span">
                          {comment.authorName || comment.author || 'Анонім'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(comment.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                      >
                        {comment.content}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < comments.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default CommentSection;