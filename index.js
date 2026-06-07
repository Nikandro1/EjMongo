require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/db');

//const autorRoutes = require('./src/routes/autorRoutes');
//const libroRoutes = require('./src/routes/libroRoutes');

//const notFound = require('./src/middlewares/notFound');
//const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

// Middlewares globales
app.use(express.json()); // parsea el body de los requests como JSON

// Rutas
//app.use('/autores', autorRoutes);
//app.use('/libros', libroRoutes);

// Middlewares de error (siempre al final)
//app.use(notFound);
//app.use(errorHandler);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});