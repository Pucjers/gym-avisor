// import React, { useState } from 'react';
// import { db } from "../../services/firebase";
// import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
// import { useAuth } from "../../contexts/AuthContext";
// import {
//   Button,
//   Typography,
//   Box,
//   TextField,
//   Paper,
//   Container,
//   Alert,
//   CircularProgress
// } from '@mui/material';

// const MakeAdmin = () => {
//   const { currentUser } = useAuth();
//   const [adminEmail, setAdminEmail] = useState(currentUser?.email || '');
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [error, setError] = useState(null);

//   const handleMakeAdmin = async () => {
//     if (!adminEmail) {
//       setError("Будь ласка, введіть email");
//       return;
//     }
    
//     setLoading(true);
//     setError(null);
//     setSuccess(false);
    
//     try {
//       // Отримуємо користувача за email
//       const usersCollection = collection(db, "users");
//       const q = query(usersCollection, where("email", "==", adminEmail));
//       const querySnapshot = await getDocs(q);
      
//       if (querySnapshot.empty) {
//         setError(`Користувача з email ${adminEmail} не знайдено!`);
//         setLoading(false);
//         return;
//       }
      
//       // Оновлюємо роль користувача
//       const userDoc = querySnapshot.docs[0];
//       await updateDoc(doc(db, "users", userDoc.id), {
//         role: 'admin',
//         updatedAt: new Date()
//       });
      
//       setSuccess(true);
//     } catch (err) {
//       setError(`Помилка при призначенні адміністратора: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Container maxWidth="sm" sx={{ py: 4 }}>
//       <Paper sx={{ p: 3 }}>
//         <Typography variant="h5" gutterBottom>
//           Призначення адміністратора
//         </Typography>
        
//         <Box sx={{ my: 2 }}>
//           <TextField
//             fullWidth
//             label="Email користувача"
//             value={adminEmail}
//             onChange={(e) => setAdminEmail(e.target.value)}
//             variant="outlined"
//             margin="normal"
//           />
//         </Box>
        
//         {error && (
//           <Alert severity="error" sx={{ mb: 2 }}>
//             {error}
//           </Alert>
//         )}
        
//         {success && (
//           <Alert severity="success" sx={{ mb: 2 }}>
//             Користувач {adminEmail} успішно призначений адміністратором!
//           </Alert>
//         )}
        
//         <Button
//           variant="contained"
//           color="primary"
//           onClick={handleMakeAdmin}
//           disabled={loading}
//         >
//           {loading ? <CircularProgress size={24} /> : "Призначити адміністратора"}
//         </Button>
//       </Paper>
//     </Container>
//   );
// };

// export default MakeAdmin;