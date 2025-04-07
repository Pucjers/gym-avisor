import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Editor } from '@tinymce/tinymce-react';
import mammoth from "mammoth";
import { useDropzone } from "react-dropzone";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Grid,
  Divider,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Description as DescriptionIcon,
  Article as ArticleIcon
} from '@mui/icons-material';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [originalFileUrl, setOriginalFileUrl] = useState(null);
  const [originalFileName, setOriginalFileName] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const editorRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const mammothOptions = {
    styleMap: [
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='Heading 4'] => h4:fresh",
      "p[style-name='Heading 5'] => h5:fresh",
      "p[style-name='Heading 6'] => h6:fresh",
      "r[style-name='Strong'] => strong",
      "r[style-name='Emphasis'] => em"
    ],
    includeDefaultStyleMap: true,
    convertImage: mammoth.images.dataUri
  };

  // Завантаження поста для редагування - видалено дублікат коментаря і налаштувань
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = doc(db, "posts", id);
        const postDoc = await getDoc(postRef);
        
        if (postDoc.exists()) {
          const postData = postDoc.data();
          
          // Перевірка чи користувач є автором
          if (postData.author !== currentUser.email) {
            setError("У вас немає прав для редагування цієї статті");
            return;
          }
          
          setTitle(postData.title);
          // Використовуємо HTML-контент, якщо він є, інакше звичайний контент
          setContent(postData.contentHtml || postData.content);
          
          // Якщо є файл, зберігаємо його URL і назву
          if (postData.fileUrl) {
            setOriginalFileUrl(postData.fileUrl);
            setOriginalFileName(postData.fileName);
          }
        } else {
          setError("Статтю не знайдено");
        }
      } catch (err) {
        console.error("Помилка отримання статті:", err);
        setError("Не вдалося завантажити статтю");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, currentUser]);

  // Обробка завантаження файлу
  const processDocxFile = async (selectedFile) => {
    if (!selectedFile) return;

    // Перевірка типу файлу
    if (selectedFile.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      setFileError("Будь ласка, виберіть файл у форматі DOCX");
      return false;
    }

    // Перевірка розміру файлу
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError(`Файл занадто великий. Максимальний розмір: ${MAX_FILE_SIZE / (1024 * 1024)} МБ`);
      return false;
    }

    // Для дуже великих файлів показуємо попередження
    if (selectedFile.size > 1 * 1024 * 1024) {
      if (!window.confirm("Цей файл великий і може зайняти певний час для обробки. Продовжити?")) {
        return false;
      }
    }

    setFile(selectedFile);
    setFileError("");
    setIsProcessingFile(true);
    
    try {
      // Читаємо файл і конвертуємо його в HTML
      const arrayBuffer = await selectedFile.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions);
      
      // Встановлюємо контент у редактор
      if (editorRef.current) {
        editorRef.current.setContent(result.value);
      }
      setContent(result.value);
      return true;
    } catch (err) {
      console.error("Помилка обробки файлу:", err);
      setFileError("Не вдалося обробити файл. Перевірте формат і спробуйте знову.");
      return false;
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Функція для Dropzone - виправив аргумент залежності
  const onDrop = useCallback(async (acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    await processDocxFile(selectedFile);
  }, [processDocxFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError("Заповніть усі поля");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Підготовка базових даних для оновлення
      const postData = {
        title,
        content: content,
        contentHtml: content,
        updatedAt: new Date()
      };

      // Створюємо посилання на документ
      const postRef = doc(db, "posts", id);
      
      // Якщо вибрано новий файл, позначаємо, що файл завантажується
      if (file) {
        postData.isFileUploading = true;
      } else {
        // Зберігаємо існуючу інформацію про файл, якщо вона є
        postData.fileUrl = originalFileUrl;
        postData.fileName = originalFileName;
      }
      
      // Оновлюємо документ з базовими даними
      await updateDoc(postRef, postData);
      
      // Перенаправляємо користувача до статті
      navigate(`/post/${id}`);
      
      // Якщо є новий файл, завантажуємо його асинхронно
      if (file) {
        const storageRef = ref(storage, `documents/${currentUser.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        // Відстежуємо прогрес завантаження
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Помилка завантаження файлу:", error);
            // Оновлюємо документ з помилкою
            updateDoc(postRef, {
              isFileUploading: false,
              fileError: "Не вдалося завантажити файл"
            });
          },
          async () => {
            // Завантаження завершено успішно
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Оновлюємо документ з інформацією про файл
            await updateDoc(postRef, {
              fileUrl: downloadURL,
              fileRef: storageRef.fullPath,
              fileName: file.name,
              isFileUploading: false
            });
          }
        );
      }
    } catch (err) {
      console.error("Помилка оновлення статті:", err);
      setError("Не вдалося оновити статтю");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !isSubmitting) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
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
        <Button
          component={Link}
          to={`/post/${id}`}
          startIcon={<ArticleIcon />}
          color="inherit"
          size="small"
        >
          Перегляд статті
        </Button>
        <Typography color="text.primary">Редагування</Typography>
      </Breadcrumbs>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Редагування статті
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Заголовок статті"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="outlined"
                placeholder="Введіть заголовок..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Завантажити DOCX (необов'язково)
              </Typography>
              
              <Card variant="outlined">
                <CardContent>
                  {originalFileName && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Поточний файл:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon color="primary" />
                        <MuiLink 
                          href={originalFileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          download={originalFileName}
                        >
                          {originalFileName}
                        </MuiLink>
                      </Box>
                    </Box>
                  )}
                  
                  <Box 
                    {...getRootProps()} 
                    sx={{
                      border: isDragActive ? '2px dashed #1976d2' : '2px dashed #e0e0e0',
                      bgcolor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                      borderRadius: 2,
                      padding: 3,
                      textAlign: 'center',
                      transition: 'all 0.2s ease-in-out',
                      cursor: 'pointer',
                      '&:hover': {
                        border: '2px dashed #1976d2',
                        bgcolor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    <input {...getInputProps()} />
                    
                    <CloudUploadIcon 
                      color={isDragActive ? "primary" : "action"} 
                      sx={{ fontSize: 40, mb: 1 }} 
                    />
                    
                    {isDragActive ? (
                      <Typography variant="body1" color="primary">
                        Перетягніть файл сюди...
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body1" gutterBottom>
                          Перетягніть новий DOCX файл сюди, або натисніть для вибору
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Підтримуються тільки файли DOCX до 5 МБ
                        </Typography>
                      </>
                    )}
                  </Box>
                  
                  {file && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon color="success" />
                      <Typography variant="body2">
                        {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} МБ)
                      </Typography>
                      <Chip 
                        label="Новий файл" 
                        size="small" 
                        color="success" 
                        variant="outlined" 
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                  )}
                  
                  {fileError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {fileError}
                    </Alert>
                  )}
                  
                  {isProcessingFile && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="primary" gutterBottom>
                        Обробка файлу...
                      </Typography>
                      <LinearProgress />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Вміст статті
              </Typography>
              
              <Editor
                apiKey="wp9vmkamiq6adfcyxghcoyncuwafklvyetkk95voibf684kw"
                onInit={(evt, editor) => editorRef.current = editor}
                initialValue={content}
                init={{
                  height: 400,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                }}
                onEditorChange={(newContent) => setContent(newContent)}
              />
            </Grid>
            
            {error && isSubmitting && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate(`/post/${id}`)}
                  startIcon={<CancelIcon />}
                >
                  Скасувати
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || isProcessingFile}
                  startIcon={<SaveIcon />}
                >
                  {isSubmitting ? "Збереження..." : "Зберегти зміни"}
                </Button>
              </Box>
            </Grid>
            
            {isSubmitting && uploadProgress > 0 && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="primary" gutterBottom>
                    Завантаження файлу: {Math.round(uploadProgress)}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditPost;