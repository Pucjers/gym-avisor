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
  CircularProgress,
  Alert
} from '@mui/material';

const ChatAI = () => {
  const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Formats AI-generated text with markdown-like syntax into HTML
   * Handles bold, italic, headers, lists, and proper spacing
   */
  const formatAIText = (aiText) => {
    if (!aiText || typeof aiText !== 'string') return '';
    
    // Split the text into lines to process each separately
    let lines = aiText.split('\n');
    let htmlOutput = '';
    let inList = false;
    let inSection = false;
    let inSubSection = false;
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Skip empty lines but add spacing
      if (!line) {
        if (inList) {
          htmlOutput += '</ul>';
          inList = false;
        }
        if (inSection || inSubSection) {
          htmlOutput += '</div>';
          inSection = false;
          inSubSection = false;
        }
        htmlOutput += '<div class="spacer my-3"></div>';
        continue;
      }
      
      // Process headers (# Header)
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)[0].length;
        const headerText = line.replace(/^#+\s+/, '');
        
        if (inList) {
          htmlOutput += '</ul>';
          inList = false;
        }
        
        if (inSection || inSubSection) {
          htmlOutput += '</div>';
          inSection = false;
          inSubSection = false;
        }
        
        htmlOutput += `<h${Math.min(level + 1, 6)} class="mt-4 mb-2 font-bold">${headerText}</h${Math.min(level + 1, 6)}>`;
        continue;
      }
      
      // Process list items
      if (line.match(/^[\*\-]\s+/)) {
        const itemText = line.replace(/^[\*\-]\s+/, '');
        const processedItem = processInlineFormatting(itemText);
        
        if (!inList) {
          htmlOutput += '<ul class="list-disc pl-6 mb-3">';
          inList = true;
        }
        
        htmlOutput += `<li>${processedItem}</li>`;
        continue;
      } else if (inList) {
        htmlOutput += '</ul>';
        inList = false;
      }
      
      // Process subsections with triple asterisks (commonly used in AI text)
      if (line.match(/^\*\*\*/)) {
        const subSectionText = line.replace(/^\*\*\*/, '').trim();
        const processedText = processInlineFormatting(subSectionText);
        
        if (inSubSection) {
          htmlOutput += '</div>';
        }
        
        htmlOutput += `<div class="ml-4 mb-2"><strong><em>${processedText}</em></strong>`;
        inSubSection = true;
        continue;
      }
      
      // Process sections with double asterisks 
      if (line.match(/^\*\*/)) {
        const sectionText = line.replace(/^\*\*/, '').trim();
        const processedText = processInlineFormatting(sectionText);
        
        if (inSection || inSubSection) {
          htmlOutput += '</div>';
          inSubSection = false;
        }
        
        htmlOutput += `<div class="mb-2"><strong>${processedText}</strong>`;
        inSection = true;
        continue;
      }
      
      // Process regular paragraph text
      const processedLine = processInlineFormatting(line);
      htmlOutput += `<p class="mb-2">${processedLine}</p>`;
    }
    
    // Close any remaining open tags
    if (inList) htmlOutput += '</ul>';
    if (inSection || inSubSection) htmlOutput += '</div>';
    
    return htmlOutput;
  };

  /**
   * Process inline formatting within a text line
   * Handles bold, italic, and other inline formats
   */
  const processInlineFormatting = (text) => {
    // Handle triple asterisks for bold italic
    let processed = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    
    // Handle bold (**text**)
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic (*text*) - but don't match already processed parts
    processed = processed.replace(/\*([^*<>]+)\*/g, '<em>$1</em>');
    
    return processed;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      // Check if API key is available
      if (!geminiApiKey) {
        throw new Error('API ключ відсутній. Будь ласка, встановіть змінну середовища REACT_APP_GEMINI_API_KEY.');
      }

      // Using Gemini Pro 1.0 model with Ukrainian prompt
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${input} (будь ласка, відповідай українською мовою)`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 2048,
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Помилка ${response.status}: ${errorData.error?.message || 'Невідома помилка'}`);
      }

      const data = await response.json();
      
      // Extract text from Gemini's response format
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Вибачте, я не зміг згенерувати відповідь.";
      
      const aiMessage = {
        text: aiText,
        sender: 'ai'
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Помилка отримання відповіді від AI:", err);
      setError(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Чат з AI для створення тренувань
      </Typography>
      <Paper sx={{ p: 2, mb: 2, maxHeight: '60vh', overflow: 'auto' }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem key={index} sx={{ 
              flexDirection: 'column', 
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 1
            }}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  maxWidth: '80%',
                  bgcolor: msg.sender === 'user' ? '#e3f2fd' : '#f5f5f5'
                }}
              >
                {msg.sender === 'ai' ? (
                  <div 
                    className="ai-message-content" 
                    dangerouslySetInnerHTML={{ __html: formatAIText(msg.text) }} 
                  />
                ) : (
                  <Typography variant="body1">{msg.text}</Typography>
                )}
              </Paper>
              <Typography variant="caption" sx={{ mt: 0.5 }}>
                {msg.sender === 'user' ? 'Ви' : 'AI'}
              </Typography>
            </ListItem>
          ))}
        </List>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Ваше повідомлення"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <Button 
          variant="contained" 
          onClick={handleSend} 
          disabled={loading || !input.trim()}
        >
          Відправити
        </Button>
      </Box>
    </Container>
  );
};

export default ChatAI;