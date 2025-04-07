import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';

const ChatAI = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      // Simulate an API call to get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }

      const data = await response.json();
      const aiMessage = { text: data.reply, sender: 'ai' };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError('Помилка при отриманні відповіді від AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Чат з AI для створення тренувань
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={msg.text}
                secondary={msg.sender === 'user' ? 'Ви' : 'AI'}
                sx={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }}
              />
            </ListItem>
          ))}
        </List>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
      </Paper>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Ваше повідомлення"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button variant="contained" onClick={handleSend}>
          Відправити
        </Button>
      </Box>
    </Container>
  );
};

export default ChatAI; 