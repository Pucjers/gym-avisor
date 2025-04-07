import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  Avatar,
  Typography
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

const CommentForm = ({ postId, onCommentAdded }) => {
  const { currentUser } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.length > 500) {
      setError('Comment cannot exceed 500 characters.');
      return;
    }
    
    if (!currentUser) {
      setError('Ви повинні увійти, щоб залишити коментар');
      return;
    }
    
    if (!postId) {
      setError('Неможливо додати коментар: ID статті відсутній');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newComment = {
        postId,
        content: comment.trim(),
        author: currentUser.email,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email.split('@')[0],
        createdAt: serverTimestamp(),
      };

      console.log("Додавання коментаря:", newComment);
      
      const docRef = await addDoc(collection(db, 'comments'), newComment);
      console.log("Коментар успішно додано, ID:", docRef.id);
      
      // Очищаємо форму після успішного додавання
      setComment('');
      
      // Викликаємо колбек, якщо він є, і додамо локальний timestamp для коректного відображення
      if (onCommentAdded) {
        const commentWithLocalDate = {
          ...newComment,
          id: docRef.id,
          createdAt: { toDate: () => new Date() } // Створюємо об'єкт, який імітує Firestore Timestamp
        };
        onCommentAdded(commentWithLocalDate);
      }
    } catch (err) {
      console.error('Помилка додавання коментаря:', err);
      setError('Не вдалося додати коментар. Спробуйте пізніше.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Увійдіть, щоб залишити коментар
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar 
          sx={{ bgcolor: 'primary.main' }}
        >
          {currentUser.email.charAt(0).toUpperCase()}
        </Avatar>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ flexGrow: 1 }}>
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
          
          {error && (
            <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
              {error}
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
  );
};

export default CommentForm;