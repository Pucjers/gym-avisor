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
  const hgToken = process.env.REACT_APP_HUGGING_FACE_API_KEY;
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
       const result = await fetch(
        "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${hgToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(input),
        }
    );
    const response = await result.json();

      const data = await response.json();
      const aiMessage = {
        text: data[0].generated_text,
        sender: 'ai'
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error fetching AI response:", err);
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