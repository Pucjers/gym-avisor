import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../services/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc,
  where
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
  Avatar,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  VerifiedUser as VerifiedUserIcon,
  Person as PersonIcon,
  Block as BlockIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  SupervisorAccount as AdminIcon,
  ArrowBack as ArrowBackIcon,
  PersonOff as PersonOffIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [openBlockDialog, setOpenBlockDialog] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [postsCount, setPostsCount] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Фільтрація та пошук користувачів
    let result = users;

    // Фільтрація за роллю
    if (filterRole !== "all") {
      result = result.filter(user => user.role === filterRole);
    }

    // Фільтрація за статусом
    if (filterStatus !== "all") {
      result = result.filter(user => user.status === filterStatus);
    }

    // Пошук за терміном
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        user => 
          (user.displayName && user.displayName.toLowerCase().includes(term)) || 
          (user.email && user.email.toLowerCase().includes(term))
      );
    }

    setFilteredUsers(result);
  }, [users, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Отримуємо всіх користувачів
      const usersCollection = collection(db, "users");
      const q = query(usersCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || "active" // Встановлюємо статус за замовчуванням
      }));
      
      setUsers(usersList);
      
      // Отримуємо кількість статей для кожного користувача
      await fetchPostsCount(usersList);
      
    } catch (error) {
      console.error("Помилка отримання користувачів:", error);
      setSnackbar({
        open: true,
        message: "Помилка завантаження користувачів",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsCount = async (usersList) => {
    try {
      const countMap = {};
      
      // Отримуємо кількість статей для кожного користувача за email
      for (const user of usersList) {
        if (user.email) {
          const postsQuery = query(
            collection(db, 'posts'),
            where('author', '==', user.email)
          );
          
          const snapshot = await getDocs(postsQuery);
          countMap[user.id] = snapshot.size;
        } else {
          countMap[user.id] = 0;
        }
      }
      
      setPostsCount(countMap);
    } catch (error) {
      console.error('Помилка отримання кількості статей:', error);
    }
  };

  const handleRoleDialogOpen = (user) => {
    setUserToChangeRole(user);
    setSelectedRole(user.role || "user");
    setOpenRoleDialog(true);
  };

  const handleRoleDialogClose = () => {
    setOpenRoleDialog(false);
    setUserToChangeRole(null);
    setSelectedRole("");
  };

  const handleChangeRole = async () => {
    if (!userToChangeRole || !selectedRole) return;
    
    try {
      // Оновлюємо роль користувача
      await updateDoc(doc(db, "users", userToChangeRole.id), {
        role: selectedRole,
        updatedAt: new Date()
      });
      
      // Оновлюємо стан
      setUsers(users.map(user => 
        user.id === userToChangeRole.id 
          ? { ...user, role: selectedRole } 
          : user
      ));
      
      setSnackbar({
        open: true,
        message: `Роль користувача "${userToChangeRole.displayName || userToChangeRole.email}" змінено на "${selectedRole}"`,
        severity: "success"
      });
    } catch (error) {
      console.error("Помилка зміни ролі користувача:", error);
      setSnackbar({
        open: true,
        message: "Помилка зміни ролі користувача",
        severity: "error"
      });
    } finally {
      handleRoleDialogClose();
    }
  };

  const handleBlockDialogOpen = (user) => {
    setUserToBlock(user);
    setOpenBlockDialog(true);
  };

  const handleBlockDialogClose = () => {
    setOpenBlockDialog(false);
    setUserToBlock(null);
  };

  const handleToggleBlockUser = async () => {
    if (!userToBlock) return;
    
    const newStatus = userToBlock.status === "blocked" ? "active" : "blocked";
    
    try {
      // Оновлюємо статус користувача
      await updateDoc(doc(db, "users", userToBlock.id), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Оновлюємо стан
      setUsers(users.map(user => 
        user.id === userToBlock.id 
          ? { ...user, status: newStatus } 
          : user
      ));
      
      setSnackbar({
        open: true,
        message: newStatus === "blocked" 
          ? `Користувача "${userToBlock.displayName || userToBlock.email}" заблоковано` 
          : `Користувача "${userToBlock.displayName || userToBlock.email}" розблоковано`,
        severity: "success"
      });
    } catch (error) {
      console.error("Помилка зміни статусу користувача:", error);
      setSnackbar({
        open: true,
        message: "Помилка зміни статусу користувача",
        severity: "error"
      });
    } finally {
      handleBlockDialogClose();
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Функція для відображення кольору ролі
  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "error";
      case "moderator":
        return "warning";
      default:
        return "primary";
    }
  };

  // Функція для відображення іконки ролі
  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <AdminIcon fontSize="small" />;
      case "moderator":
        return <VerifiedUserIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
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
        <Typography color="text.primary">Управління користувачами</Typography>
      </Breadcrumbs>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Управління користувачами
          </Typography>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
          >
            Оновити
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Фільтри та пошук */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Пошук користувачів"
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
            <InputLabel id="role-filter-label">Роль</InputLabel>
            <Select
              labelId="role-filter-label"
              value={filterRole}
              label="Роль"
              onChange={(e) => setFilterRole(e.target.value)}
              startAdornment={<FilterListIcon color="action" sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">Всі ролі</MenuItem>
              <MenuItem value="admin">Адміністратори</MenuItem>
              <MenuItem value="moderator">Модератори</MenuItem>
              <MenuItem value="user">Користувачі</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: '150px' }} size="small">
            <InputLabel id="status-filter-label">Статус</InputLabel>
            <Select
              labelId="status-filter-label"
              value={filterStatus}
              label="Статус"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">Всі статуси</MenuItem>
              <MenuItem value="active">Активні</MenuItem>
              <MenuItem value="blocked">Заблоковані</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* Таблиця користувачів */}
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
                    <TableCell>Користувач</TableCell>
                    <TableCell>Емейл</TableCell>
                    <TableCell>Роль</TableCell>
                    <TableCell>Статуc</TableCell>
                    <TableCell>Статей</TableCell>
                    <TableCell align="center">Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Користувачі не знайдені
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow 
                        key={user.id}
                        sx={{ 
                          '&:hover': { bgcolor: 'action.hover' },
                          bgcolor: user.status === 'blocked' ? 'rgba(211, 47, 47, 0.04)' : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              src={user.photoURL} 
                              alt={user.displayName || user.email}
                              sx={{ mr: 2 }}
                            >
                              {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2">
                              {user.displayName || "Без імені"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            icon={getRoleIcon(user.role)}
                            label={user.role || "user"} 
                            color={getRoleColor(user.role)} 
                            size="small" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>
                          {user.status === "blocked" ? (
                            <Chip 
                              icon={<PersonOffIcon fontSize="small" />}
                              label="Заблокований" 
                              color="error" 
                              size="small" 
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              icon={<CheckCircleIcon fontSize="small" />}
                              label="Активний" 
                              color="success" 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>{postsCount[user.id] || 0}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Tooltip title="Змінити роль">
                              <IconButton
                                color="primary"
                                onClick={() => handleRoleDialogOpen(user)}
                              >
                                <VerifiedUserIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.status === "blocked" ? "Розблокувати" : "Заблокувати"}>
                              <IconButton
                                color={user.status === "blocked" ? "success" : "error"}
                                onClick={() => handleBlockDialogOpen(user)}
                                disabled={user.role === "admin"}
                              >
                                {user.status === "blocked" ? <CheckCircleIcon /> : <BlockIcon />}
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
            
            {/* Статистика відфільтрованих користувачів */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="body2" color="text.secondary">
                Показано користувачів: {filteredUsers.length} з {users.length}
              </Typography>
            </Box>
          </>
        )}
      </Paper>
      
      {/* Діалог зміни ролі */}
      <Dialog
        open={openRoleDialog}
        onClose={handleRoleDialogClose}
      >
        <DialogTitle>Змінити роль користувача</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Змінити роль для користувача "{userToChangeRole?.displayName || userToChangeRole?.email}"
          </DialogContentText>
          <FormControl fullWidth>
            <InputLabel id="role-select-label">Роль</InputLabel>
            <Select
              labelId="role-select-label"
              value={selectedRole}
              label="Роль"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <MenuItem value="user">Користувач</MenuItem>
              <MenuItem value="moderator">Модератор</MenuItem>
              <MenuItem value="admin">Адміністратор</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRoleDialogClose}>Скасувати</Button>
          <Button onClick={handleChangeRole} color="primary" variant="contained">
            Змінити роль
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Діалог блокування/розблокування */}
      <Dialog
        open={openBlockDialog}
        onClose={handleBlockDialogClose}
      >
        <DialogTitle>
          {userToBlock?.status === "blocked" ? "Розблокувати користувача?" : "Заблокувати користувача?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {userToBlock?.status === "blocked" 
              ? `Ви впевнені, що хочете розблокувати користувача "${userToBlock?.displayName || userToBlock?.email}"?` 
              : `Ви впевнені, що хочете заблокувати користувача "${userToBlock?.displayName || userToBlock?.email}"?`
            }
            {userToBlock?.status !== "blocked" && " Заблокований користувач не зможе додавати статті та коментарі."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBlockDialogClose}>Скасувати</Button>
          <Button 
            onClick={handleToggleBlockUser} 
            color={userToBlock?.status === "blocked" ? "success" : "error"} 
            variant="contained"
          >
            {userToBlock?.status === "blocked" ? "Розблокувати" : "Заблокувати"}
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

export default AdminUsers;