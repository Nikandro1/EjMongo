require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/db');
const autorRoutes = require('./src/routes/autorRoutes');
const libroRoutes = require('./src/routes/libroRoutes');
const app = express();


app.use(express.json()); 
app.use('/autores', autorRoutes);
app.use('/libros', libroRoutes);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});