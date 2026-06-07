# 📦 CRUD con MongoDB, Mongoose y Node.js

Proyecto de ejemplo para practicar operaciones CRUD usando **Node.js**, **Express**, **Mongoose** y **MongoDB**, organizado con una arquitectura por capas (schemas, models, controllers, routes, middlewares).

---

## 📁 Estructura del proyecto

```
mongo-crud/
├── src/
│   ├── config/
│   │   └── db.js                    # Conexión a MongoDB
│   ├── controllers/
│   │   ├── authorController.js      # Lógica CRUD para autores
│   │   └── bookController.js        # Lógica CRUD para libros
│   ├── middlewares/
│   │   ├── errorHandler.js          # Manejo centralizado de errores
│   │   ├── notFound.js              # Rutas no encontradas (404)
│   │   └── validateObjectId.js      # Valida que un :id sea un ObjectId válido
│   ├── models/
│   │   ├── Autor.js                # Schema + modelo de Autor
│   │   └── Libro.js                  # Schema + modelo de Libro
│   └── routes/
│       ├── autorRoutes.js          # Rutas /autores
│       └── libroRoutes.js            # Rutas /libros
├── .env                             # Variables de entorno
├── docker-compose.yml
├── Dockerfile
├── index.js                         # Entry point (levanta el servidor)
├── package.json
└── README.md
```

---

## 🚀 Primeros pasos

### 1. Crear el proyecto

```bash
mkdir mongo-api && cd mongo-api
npm init -y
npm install express mongoose dotenv
npm install -D nodemon
```

### 2. Crear la estructura de carpetas

```bash
mkdir -p src/config src/controllers src/middlewares src/models src/routes
```

---

## ⚙️ Configuración

### `.env`

```env
MONGO_URI=mongodb://mongo:27017/libreria
PORT=3000
```

> Si corrés el proyecto **sin Docker** (MongoDB local), cambiá `MONGO_URI` a `mongodb://localhost:27017/libreria`.

---

### `src/config/db.js` — Conexión a MongoDB

```js
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error al conectar:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
```

---

## 🧩 Models

Cada archivo de model define su propio schema de Mongoose y exporta el modelo directamente. El schema describe la estructura, tipos y validaciones del documento.

### `src/models/Autor.js`

```js
const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    nationality: {
      type: String
    },
    birthYear: {
      type: Number
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
  }
);

const Author = mongoose.model('Author', authorSchema);

module.exports = Author;
```

---

### `src/models/Libro.js`

```js
const mongoose = require('mongoose');

const libroSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true
    },
    genero: {
      type: String
    },
    anio: {
      type: Number
    },
    // ref: 'Autor' indica que este campo apunta a un documento del modelo Autor
    // Permite usar .populate('autor') para obtener el objeto completo en lugar del _id
    autor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Autor',
      required: true
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: clasifica el libro según su año de publicación
// No se guarda en MongoDB, se calcula cada vez que se accede al documento
libroSchema.virtual('era').get(function () {
  if (!this.anio) return 'sin clasificar';
  if (this.anio < 1800) return 'antiguo';
  if (this.anio < 1950) return 'moderno';
  return 'contemporáneo';
});

const Libro = mongoose.model('Libro', libroSchema);

module.exports = Libro;
```

---

## 🎮 Controllers

Los controllers contienen la lógica de negocio: reciben el `req`, operan sobre la base de datos y envían el `res`. No saben nada de rutas.

### `src/controllers/autorController.js`

```js
const Autor = require('../models/Autor');

// GET /autores
const getAutores = async (req, res, next) => {
  try {
    const autores = await Autor.find();
    res.json(autores);
  } catch (error) {
    res.status(500).json({message: "Error al buscar autores"})
  }
};

// GET /autores/:id
const getAutorById = async (req, res, next) => {
  try {
    const autor = await Autor.findById(req.params.id);
    if (!autor) {
      return res.status(404).json({ message: 'Autor no encontrado' });
    }
    res.json(autor);
  } catch (error) {
    res.status(500).json({message: "Error al buscar autor"})
  }
};

// POST /autores
const createAutor = async (req, res, next) => {
  try {
    const autor = await Autor.create(req.body);
    res.status(201).json(autor);
  } catch (error) {
    res.status(500).json({message: "Error al crear autor"})
  }
};

// PUT /autores/:id
const updateAutor = async (req, res, next) => {
  try {
    const autor = await Autor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // new: devuelve el doc actualizado;
    );
    if (!autor) {
      return res.status(404).json({ message: 'Autor no encontrado' });
    }
    res.json(autor);
  } catch (error) {
    res.status(500).json({message: "Error al actualizar autor"})
  }
};

// DELETE /autores/:id
const deleteAutor = async (req, res, next) => {
  try {
    const autor = await Autor.findByIdAndDelete(req.params.id);
    if (!autor) {
      return res.status(404).json({ message: 'Autor no encontrado' });
    }
    res.json({ message: 'Autor eliminado correctamente' });
  } catch (error) {
    res.status(404).json({message: "Error al crear autor"})
  }
};

module.exports = { getAutores, getAutorById, createAutor, updateAutor, deleteAutor };
```

---

### `src/controllers/libroController.js`

```js
const Libro = require('../models/Libro');

// GET /libros
const getAllLibros = async (req, res, next) => {
  try {
    // populate reemplaza el ObjectId de author por el documento completo
    const libros = await Libro.find().populate('author', 'name nationality');
    if (!libros) {
      return res.status(404).json({ message: 'Libros no encontrado' });
    }
    res.status(200).json(libros);
  } catch (error) {
    res.status(500).json({message: "Error al buscar libros"})
  }
};

// GET /libros/:id
const getLibroById = async (req, res, next) => {
  try {
    const libro = await Libro.findById(req.params.id).populate('author', 'name nationality');
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.status(200).json(libros);
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
};

// POST /libros
const createLibro = async (req, res, next) => {
  try {
    const libro = await Libro.create(req.body);
    res.status(201).json(libro);
  } catch (error) {
    res.status(500).json({message: "Error al crear libro"})
  }
};

// PUT /libros/:id
const updateLibro = async (req, res, next) => {
  try {
    const libro = await Libro.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true}
    );
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.status(200).json(libro);
  } catch (error) {
    res.status(500).json({message: "Error al actualizar un libro"})
  }
};

// DELETE libros/:id
const deleteLibro = async (req, res, next) => {
  try {
    const libro = await Libro.findByIdAndDelete(req.params.id);
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.status(200).json({ message: 'Libro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({message: "Error al eliminar libro"})
  }
};

module.exports = { getAllLibros, getLibroById, createLibro, updateLibro, deleteLibro };
```
---

### Usar el virtual `era` en un controller

Los virtuals **no existen como campo en MongoDB**, por lo que no se pueden usar directamente en un `find()`. Para filtrar por un virtual hay que traer los documentos primero y luego filtrarlos en memoria con `.filter()`.

```js
// GET /libros/era/:era
const getLibroByEra = async (req, res, next) => {
  try {
    const { era } = req.params;
    const validas = ['antiguo', 'moderno', 'contemporáneo', 'sin clasificar'];

    if (!validas.includes(era)) {
      return res.status(400).json({ message: `Era inválida. Valores posibles: ${validas.join(', ')}` });
    }

    // lean() NO sirve acá porque desactiva los virtuals
    // Traemos todos los libros como documentos Mongoose para que el virtual funcione
    const libros = await Libro.find().populate('autor', 'nombre');

    // Filtramos en memoria usando el virtual era de cada documento
    const resultado = libros.filter((libro) => libro.era === era);

    res.status(200)json(resultado);
  } catch (error) {
    res.status(500).json({message: "Error al buscar libro por era"})
  }
};
```

> **¿Por qué no usar `.find({ era: 'moderno' })`?**
> Porque `era` no existe en la colección de MongoDB, solo vive en la capa de Mongoose.
> Si necesitás filtrar por ese criterio frecuentemente y con grandes volúmenes de datos,
> lo recomendable es guardar el campo calculado como un campo real en el schema
> y actualizarlo con un hook `pre('save')`.
---

## 🛣️ Routes

Las rutas conectan cada endpoint HTTP con su función de controller (y sus middlewares intermedios si aplica).

### `src/routes/autorRoutes.js`

```js
const { Router } = require('express');
const { getAutores, getAutorById, createAutor, updateAutor, deleteAutor } = require('../controllers/autorController');
const validateObjectId = require('../middlewares/validateObjectId');

const router = Router();

router.get('/', getAutores);
router.get('/:id', validateObjectId, getAutorById);
router.post('/', createAutor);
router.put('/:id', validateObjectId, updateAutor);
router.delete('/:id', validateObjectId, deleteAutor);

module.exports = router;
```

---

### `src/routes/libroRoutes.js`

```js
const { Router } = require('express');
const { getAllLibros, getLibroById, createLibro, updateLibro, deleteLibro } = require('../controllers/libroController');
const validateObjectId = require('../middlewares/validateObjectId');

const router = Router();

router.get('/', getAllLibros);
router.get('/:id', validateObjectId, getLibroById);
router.post('/', createLibro);
router.put('/:id', validateObjectId, updateLibro);
router.delete('/:id', validateObjectId, deleteLibro);

module.exports = router;
```

---

## 🔧 Middlewares

Los middlewares son funciones que se ejecutan **antes** (o después) del controller. Tienen la firma `(req, res, next)`.

### `src/middlewares/validateObjectId.js`

Valida que el `:id` recibido sea un ObjectId de MongoDB válido antes de llegar al controller. Evita que Mongoose lance un error de casteo innecesario.

```js
const mongoose = require('mongoose');

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'El ID proporcionado no es válido' });
  }
  next(); // id válido → continúa al controller
};

module.exports = validateObjectId;
```

---

### `src/middlewares/errorHandler.js`

Middleware de manejo de errores. Express lo identifica por tener **4 parámetros** `(err, req, res, next)`. Se registra **al final del todo**, después de rutas y notFound.

```js
const errorHandler = (err, req, res, next) => {
  console.error('💥 Error:', err.message);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Error de validación', errors: messages });
  }

  // Error de duplicado (índice único)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Ya existe un registro con ese valor' });
  }

  // Error genérico
  res.status(500).json({ message: 'Error interno del servidor' });
};

module.exports = errorHandler;
```

---

## 🏗️ Entry point

### `index.js`

Es el punto de entrada de la aplicación. Vive en la raíz del proyecto, fuera de `src/`.

```js
require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/db');

const autorRoutes = require('./src/routes/autorRoutes');
const libroRoutes = require('./src/routes/libroRoutes');

const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

// Middlewares globales
app.use(express.json()); // parsea el body de los requests como JSON

// Rutas
app.use('/autores', autorRoutes);
app.use('/libros', libroRoutes);

// Middlewares de error (siempre al final)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});
```

---

## 🐳 Docker

### `Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "index.js"]
```

---

### `docker-compose.yml`

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      mongo:
        condition: service_healthy
    environment:
      MONGO_URI: mongodb://mongo:27017/libreria
      PORT: 3000
    networks:
      - mongo-net

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - mongo-net

volumes:
  mongo-data:

networks:
  mongo-net:
```

---

## ▶️ Correr el proyecto

### Con Docker (recomendado)

```bash
# Construir y levantar
docker compose up --build

# Correr sin rebuild
docker compose up

# Detener contenedores
docker compose down

# Detener y borrar el volumen de datos
docker compose down -v
```

### Sin Docker (MongoDB local)

```bash
# Cambiar en .env:
# MONGO_URI=mongodb://localhost:27017/libreria

node index.js
```
## 🔍 Consultas avanzadas

Estos métodos se encadenan sobre `Model.find()` para refinar los resultados. No son rutas del proyecto, son ejemplos para entender las capacidades de Mongoose.

```js
// Traer solo los campos nombre y nacionalidad (excluye _id con -_id)
await Autor.find().select('nombre nacionalidad -_id');

// Ordenar por anioNacimiento descendente (-1) o ascendente (1)
await Autor.find().sort({ anioNacimiento: -1 });

// Paginación: saltear los primeros 10 y traer los siguientes 5
await Autor.find().skip(10).limit(5);

// lean() devuelve objetos JS planos, sin métodos Mongoose — más rápido para solo lectura
// Importante: lean() desactiva los virtuals, no usarlo cuando necesitás acceder a ellos
await Autor.find().lean();

// Contar documentos que cumplan una condición sin traerlos
await Autor.countDocuments({ nacionalidad: 'Colombia' });

// Operadores de comparación numérica
await Libro.find({ anio: { $gte: 1950, $lte: 2000 } }); // entre 1950 y 2000
await Libro.find({ anio: { $gt: 1980 } });               // mayor a 1980
await Libro.find({ anio: { $lt: 1900 } });               // menor a 1900

// $in: el campo debe estar dentro de una lista de valores
await Libro.find({ genero: { $in: ['Terror', 'Ciencia ficción'] } });

// $nin: el campo NO debe estar dentro de la lista
await Libro.find({ genero: { $nin: ['Romance'] } });

// $regex: búsqueda por patrón en strings (i = case insensitive)
await Libro.find({ titulo: { $regex: 'cien', $options: 'i' } });

// $or: al menos una condición se cumple
await Libro.find({ $or: [{ anio: { $lt: 1900 } }, { genero: 'Clásico' }] });

// $and: todas las condiciones se cumplen (útil cuando hay ambigüedad)
await Libro.find({ $and: [{ anio: { $gte: 1900 } }, { genero: 'Realismo mágico' }] });
```

---

## ✏️ Operadores de actualización

En vez de reemplazar todo el documento, estos operadores modifican **solo los campos indicados**. Se usan dentro de `findByIdAndUpdate` o `updateMany`.

### `$set` — actualizar campos específicos

Sin `$set`, si pasás un objeto plano Mongoose puede reemplazar el documento entero con lo que le pasás. Con `$set`, solo toca los campos indicados y deja el resto intacto.

```js
// Sin $set: puede pisar campos que no querías tocar
await Libro.findByIdAndUpdate(id, { genero: 'Terror' });

// Con $set: solo actualiza genero, el resto del documento no se toca
await Libro.findByIdAndUpdate(
  id,
  { $set: { genero: 'Terror' } },
  { new: true }
);

// Se pueden actualizar varios campos a la vez
await Libro.findByIdAndUpdate(
  id,
  { $set: { genero: 'Terror', anio: 1985 } },
  { new: true }
);
```

---

### `$inc` — incrementar o decrementar un valor numérico

Útil para contadores, puntajes o cualquier campo numérico que cambie de a incrementos.

```js
// Supongamos que Libro tiene: visitas: { type: Number, default: 0 }

// Incrementar en 1
await Libro.findByIdAndUpdate(id, { $inc: { visitas: 1 } });

// Decrementar en 5
await Libro.findByIdAndUpdate(id, { $inc: { visitas: -5 } });
```

---

### `$push` — agregar un elemento a un array

```js
// Supongamos que Libro tiene: etiquetas: [String]

// Agregar una etiqueta
await Libro.findByIdAndUpdate(
  id,
  { $push: { etiquetas: 'best-seller' } },
  { new: true }
);

// Agregar múltiples elementos a la vez con $each
await Libro.findByIdAndUpdate(
  id,
  { $push: { etiquetas: { $each: ['clásico', 'premiado'] } } },
  { new: true }
);
```

---

### `$pull` — eliminar un elemento de un array

```js
// Elimina todas las ocurrencias de 'best-seller' dentro del array etiquetas
await Libro.findByIdAndUpdate(
  id,
  { $pull: { etiquetas: 'best-seller' } },
  { new: true }
);

// Eliminar múltiples valores a la vez
await Libro.findByIdAndUpdate(
  id,
  { $pull: { etiquetas: { $in: ['clásico', 'premiado'] } } },
  { new: true }
);
```

---

### Combinando operadores en una sola operación

```js
await Libro.findByIdAndUpdate(
  id,
  {
    $set: { genero: 'Terror' },
    $inc: { visitas: 1 },
    $push: { etiquetas: 'recomendado' },
  },
  { new: true }
);
```

> **Resumen rápido**
>
> | Operador | Para qué sirve |
> |---|---|
> | `$set` | Actualizar campos específicos sin tocar el resto |
> | `$inc` | Sumar o restar a un campo numérico |
> | `$push` | Agregar un elemento a un array |
> | `$pull` | Eliminar un elemento de un array |

---

## 🔗 Aggregation Pipeline

El **Aggregation Pipeline** es una herramienta de MongoDB para procesar documentos en etapas. Cada etapa recibe los documentos de la etapa anterior, los transforma y los pasa a la siguiente. Se ejecuta con `Model.aggregate([...])`.

Es más potente que `find()` porque permite hacer joins, agrupaciones y cálculos directamente en la base de datos, sin traer todos los datos a Node primero.

```
Colección → $match → $lookup → $unwind → $group → $project → resultado
```

---

### `$match` — filtrar documentos

Equivalente al `WHERE` de SQL. Siempre conviene ponerlo **primero** para reducir la cantidad de documentos que procesan las etapas siguientes.

```js
// Traer solo los libros publicados después de 1950
const resultado = await Libro.aggregate([
  { $match: { anio: { $gt: 1950 } } }
]);

// Combinar condiciones
const resultado = await Libro.aggregate([
  { $match: { anio: { $gte: 1900 }, genero: 'Realismo mágico' } }
]);
```

---

### `$lookup` — join entre colecciones

Equivalente al `JOIN` de SQL. Une documentos de otra colección basándose en un campo en común.

```js
// Traer cada libro con los datos completos de su autor
const resultado = await Libro.aggregate([
  {
    $lookup: {
      from: 'autors',       // nombre real de la colección en MongoDB
                            // Mongoose pluraliza el modelo 'Autor' → 'autors'
      localField: 'autor',  // campo en Libro que tiene el ObjectId
      foreignField: '_id',  // campo en autors que debe coincidir
      as: 'datosAutor',     // nombre del array que se agrega al documento resultado
    },
  },
]);

// Resultado de cada documento:
// {
//   titulo: 'Cien años de soledad',
//   anio: 1967,
//   datosAutor: [{ _id: '...', nombre: 'García Márquez', nacionalidad: 'Colombia' }]
// }
```

> **Importante:** `$lookup` devuelve el resultado siempre como un **array**, incluso si es una relación 1 a 1. Para convertirlo en objeto se usa `$unwind`.

---

### `$unwind` — aplanar un array

Convierte el array generado por `$lookup` en un objeto por elemento. Si el array tiene un solo elemento (relación 1 a 1), el documento queda con ese objeto directo.

```js
const resultado = await Libro.aggregate([
  {
    $lookup: {
      from: 'autors',
      localField: 'autor',
      foreignField: '_id',
      as: 'datosAutor',
    },
  },
  { $unwind: '$datosAutor' }, // ahora datosAutor es un objeto, no un array
]);

// Resultado:
// {
//   titulo: 'Cien años de soledad',
//   datosAutor: { nombre: 'García Márquez', nacionalidad: 'Colombia' }
// }
```

---

### `$group` — agrupar y calcular

Equivalente al `GROUP BY` de SQL. Agrupa documentos por un campo y permite calcular totales, promedios, máximos y mínimos.

```js
// Contar cuántos libros hay por género
const resultado = await Libro.aggregate([
  {
    $group: {
      _id: '$genero',       // campo por el que se agrupa (obligatorio)
      total: { $sum: 1 },   // suma 1 por cada documento del grupo
    },
  },
]);

// Resultado:
// [
//   { _id: 'Realismo mágico', total: 3 },
//   { _id: 'Terror', total: 5 },
// ]

// Promedio, máximo y mínimo de año por género
const resultado = await Libro.aggregate([
  {
    $group: {
      _id: '$genero',
      promedioAnio:  { $avg: '$anio' },
      libroMasNuevo: { $max: '$anio' },
      libroMasViejo: { $min: '$anio' },
    },
  },
]);
```

---

### `$project` — elegir y renombrar campos

Equivalente al `SELECT` de SQL. Define qué campos incluir, excluir o transformar en el resultado final.

```js
const resultado = await Libro.aggregate([
  {
    $project: {
      _id: 0,                                        // 0 = excluir
      titulo: 1,                                     // 1 = incluir
      anio: 1,
      tituloMayusculas: { $toUpper: '$titulo' },     // campo calculado
    },
  },
]);

// Resultado:
// [{ titulo: 'Cien años de soledad', anio: 1967, tituloMayusculas: 'CIEN AÑOS DE SOLEDAD' }]
```

---

### Pipeline completo — combinando todas las etapas

```js
// Traer libros posteriores a 1900, con datos del autor,
// mostrando solo titulo, anio y nombre del autor
const resultado = await Libro.aggregate([
  { $match: { anio: { $gte: 1900 } } },         // 1. filtrar por año
  {
    $lookup: {                                    // 2. join con la colección autors
      from: 'autors',
      localField: 'autor',
      foreignField: '_id',
      as: 'datosAutor',
    },
  },
  { $unwind: '$datosAutor' },                    // 3. aplanar el array a objeto
  {
    $project: {                                   // 4. elegir y renombrar campos
      _id: 0,
      titulo: 1,
      anio: 1,
      autor: '$datosAutor.nombre',               // renombrar campo anidado
    },
  },
]);

// Resultado:
// [
//   { titulo: 'Cien años de soledad', anio: 1967, autor: 'García Márquez' },
//   { titulo: 'Rayuela', anio: 1963, autor: 'Julio Cortázar' }
// ]
```

---

> **`aggregate()` vs `find()`**
>
> | | `find()` | `aggregate()` |
> |---|---|---|
> | Uso | Consultas simples | Consultas complejas con cálculos o joins |
> | Joins | `.populate()` (Mongoose) | `$lookup` (MongoDB) |
> | Agrupaciones | ✗ | `$group` |
> | Rendimiento en joins | Hace queries extra por populate | Todo en una sola query en la BD |
> | Virtuals disponibles | ✅ | ✗ (trabaja directo sobre MongoDB) |
### `src/models/Autor.js` — ejemplos de uso

`````js
// Traer solo los campos name y nationality (excluye _id con -_id)
await Autor.find().select('name nationality -_id');

// Ordenar por birthYear descendente (-1) o ascendente (1)
await Autor.find().sort({ birthYear: -1 });

// Paginación: saltear los primeros 10 y traer los siguientes 5
await Autor.find().skip(10).limit(5);

// lean() devuelve objetos JS planos, sin métodos Mongoose — más rápido para solo lectura
await Autor.find().lean();

// Contar documentos que cumplan una condición sin traerlos
await Autor.countDocuments({ nationality: 'Colombia' });

// Operadores de comparación
await Libro.find({ year: { $gte: 1950, $lte: 2000 } }); // entre 1950 y 2000
await Libro.find({ year: { $gt: 1980 } });               // mayor a 1980

// $in: campo que esté dentro de una lista
await Libro.find({ genre: { $in: ['Terror', 'Ciencia ficción'] } });

// $regex: búsqueda por patrón (i = case insensitive)
await Libro.find({ title: { $regex: 'cien', $options: 'i' } });

// $or: al menos una condición se cumple
await Libro.find({ $or: [{ year: { $lt: 1900 } }, { genre: 'Clásico' }] });
\```

---

---

## 🧪 Probar los endpoints

Con el servidor corriendo en `http://localhost:3000`:

### Autores

```bash
# Crear un autor
curl -X POST http://localhost:3000/api/authors \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Gabriel García Márquez", "nacionalidad": "Colombia", "anioNacimiento": 1927}'

# Obtener todos
curl http://localhost:3000/api/authors

# Obtener por ID (reemplazá <id> por un _id real)
curl http://localhost:3000/api/authors/<id>

# Actualizar
curl -X PUT http://localhost:3000/api/authors/<id> \
  -H "Content-Type: application/json" \
  -d '{"nacionalidad": "Colombiana"}'

# Eliminar
curl -X DELETE http://localhost:3000/api/authors/<id>
```

### Libros

```bash
# Crear un libro (el campo author debe ser un _id válido de un autor existente)
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Cien años de soledad", "genero": "Realismo mágico", "anio": 1967, "autor": "<author_id>"}'

# Obtener todos (incluye datos del autor via populate)
curl http://localhost:3000/api/books
```

---

## 🗺️ Tabla de endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/autores` | Listar todos los autores |
| GET | `/autores/:id` | Obtener un autor por ID |
| POST | `/authors` | Crear un autor |
| PUT | `/autores/:id` | Actualizar un autor |
| DELETE | `/autores/:id` | Eliminar un autor |
| GET | `/libros` | Listar todos los libros (con autor populado) |
| GET | `/libros/:id` | Obtener un libro por ID |
| POST | `/libros` | Crear un libro |
| PUT | `/libros/:id` | Actualizar un libro |
| DELETE | `/libros/:id` | Eliminar un libro |

---

## 🔑 Conceptos clave

| Concepto | Descripción |
|---|---|
| `Schema` | Define estructura, tipos y validaciones. Vive separado del model. (JOI)|
| `Model` | Clase generada por Mongoose a partir del schema. Da acceso a los métodos de la colección. |
| `Controller` | Contiene la lógica de cada operación. Recibe `req`, opera la DB, envía `res`. |
| `Route` | Asocia método HTTP + path con su controller (y middlewares intermedios). |
| `Middleware` | Función `(req, res, next)` que se ejecuta antes del controller para validar, transformar o manejar errores. |
| `populate()` | Reemplaza un `ObjectId` por el documento referenciado al momento de la consulta. |
| `next(error)` | Delega un error al middleware `errorHandler` en lugar de manejarlo inline. |
| `runValidators` | Opción en `findByIdAndUpdate` para que aplique las validaciones del schema también en actualizaciones. |