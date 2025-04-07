import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Box,
  Paper
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

const CommentList = ({ comments }) => {
  // Перевірка на наявність коментарів
  if (!comments || comments.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Коментарів поки немає. Будьте першим, хто прокоментує!
        </Typography>
      </Paper>
    );
  }

  // Функція форматування часу з обробкою помилок
  const formatDate = (dateObj) => {
    try {
      if (!dateObj) return "щойно";
      
      const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
      
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: uk
      });
    } catch (error) {
      console.error("Помилка форматування дати:", error);
      return "щойно";
    }
  };

  return (
    <Paper sx={{ mb: 3 }}>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {comments.map((comment, index) => (
          <React.Fragment key={comment.id || index}>
            <ListItem alignItems="flex-start" sx={{ py: 2 }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {comment.authorName?.charAt(0).toUpperCase() || 
                   comment.author?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" component="span">
                      {comment.authorName || comment.author || 'Анонім'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {comment.createdAt ? formatDate(comment.createdAt) : 'щойно'}
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
  );
};

export default CommentList;