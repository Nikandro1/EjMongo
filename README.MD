# 📦 CRUD con MongoDB, Mongoose y Node.js

Proyecto de ejemplo para practicar operaciones CRUD usando **Node.js**, **Express**, **Mongoose** y **MongoDB**, organizado con una arquitectura por capas (models, controllers, routes, middlewares).

---

## 📁 Estructura del proyecto

```
mongo-api/
├── src/
│   ├── config/
│   │   └── db.js                  # Conexión a MongoDB
│   ├── controllers/
│   │   ├── autorController.js     # Lógica CRUD para autores
│   │   └── libroController.js     # Lógica CRUD para libros
│   ├── middlewares/
│   │   ├── errorHandler.js        # Manejo centralizado de errores
│   │   ├── notFound.js            # Rutas no encontradas (404)
│   │   └── validateObjectId.js    # Valida que un :id sea un ObjectId válido
│   ├── models/
│   │   ├── Autor.js               # Schema + modelo de Autor
│   │   └── Libro.js               # Schema + modelo de Libro
│   └── routes/
│       ├── autorRoutes.js         # Rutas /autores
│       └── libroRoutes.js         # Rutas /libros
├── .env                           # Variables de entorno
├── docker-compose.yml
├── Dockerfile
├── index.js                       # Entry point (levanta el servidor)
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
PORT=3001
MONGO_URL=mongodb://admin:admin1234@mongodb:27017/seriesMongo?authSource=admin

# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=admin1234

# Mongo Express
ME_USERNAME=web
ME_PASSWORD=web1234
```

> Si corrés el proyecto **sin Docker** (MongoDB local), cambiá el host `mongodb` por `localhost` en `MONGO_URL`.

---

### `src/config/db.js`

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

const autorSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    nacionalidad: {
      type: String,
    },
    anioNacimiento: {
      type: Number,
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
  }
);

const Autor = mongoose.model('Autor', autorSchema);

module.exports = Autor;
```

---

### `src/models/Libro.js`

```js
const mongoose = require('mongoose');

const libroSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
    },
    genero: {
      type: String,
    },
    anio: {
      type: Number,
    },
    // ref: 'Autor' indica que este campo apunta a un documento del modelo Autor
    // Permite usar .populate('autor') para obtener el objeto completo en lugar del _id
    autor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Autor',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },   // incluye virtuals en res.json()
    toObject: { virtuals: true }, // incluye virtuals al acceder el objeto en código
  }
);

// Virtual: clasifica el libro según su año de publicación
// No se guarda en MongoDB, se calcula cada vez que se accede al documento
// Importante: usar function() y no arrow function para poder acceder a this
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
    res.status(500).json({ message: 'Error al buscar autores' });
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
    res.status(500).json({ message: 'Error al buscar autor' });
  }
};

// POST /autores
const createAutor = async (req, res, next) => {
  try {
    const autor = await Autor.create(req.body);
    res.status(201).json(autor);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear autor' });
  }
};

// PUT /autores/:id
const updateAutor = async (req, res, next) => {
  try {
    const autor = await Autor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // devuelve el documento ya actualizado
    );
    if (!autor) {
      return res.status(404).json({ message: 'Autor no encontrado' });
    }
    res.json(autor);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar autor' });
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
    res.status(500).json({ message: 'Error al eliminar autor' });
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
    // populate reemplaza el ObjectId de autor por el documento completo
    const libros = await Libro.find().populate('autor', 'nombre nacionalidad');
    res.status(200).json(libros);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar libros' });
  }
};

// GET /libros/:id
const getLibroById = async (req, res, next) => {
  try {
    const libro = await Libro.findById(req.params.id).populate('autor', 'nombre nacionalidad');
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.status(200).json(libro);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar libro' });
  }
};

// POST /libros
const createLibro = async (req, res, next) => {
  try {
    const libro = await Libro.create(req.body);
    res.status(201).json(libro);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear libro' });
  }
};

// PUT /libros/:id
const updateLibro = async (req, res, next) => {
  try {
    const libro = await Libro.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.status(200).json(libro);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar libro' });
  }
};

// DELETE /libros/:id
const deleteLibro = async (req, res, next) => {
  try {
    const libro = await Libro.findByIdAndDelete(req.params.id);
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.status(200).json({ message: 'Libro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar libro' });
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
      return res.status(400).json({
        message: `Era inválida. Valores posibles: ${validas.join(', ')}`,
      });
    }

    // lean() NO sirve acá porque desactiva los virtuals
    // Traemos todos los libros como documentos Mongoose para que el virtual funcione
    const libros = await Libro.find().populate('autor', 'nombre');

    // Filtramos en memoria usando el virtual era de cada documento
    const resultado = libros.filter((libro) => libro.era === era);

    res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar libros por era' });
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

Las rutas conectan cada endpoint HTTP con su función de controller y sus middlewares intermedios.

### `src/routes/autorRoutes.js`

```js
const { Router } = require('express');
const {
  getAutores,
  getAutorById,
  createAutor,
  updateAutor,
  deleteAutor,
} = require('../controllers/autorController');
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
const {
  getAllLibros,
  getLibroById,
  createLibro,
  updateLibro,
  deleteLibro,
  getLibroByEra,
} = require('../controllers/libroController');
const validateObjectId = require('../middlewares/validateObjectId');

const router = Router();

// Importante: la ruta /era/:era debe ir ANTES de /:id
// Si va después, Express interpreta 'era' como un id y falla
router.get('/era/:era', getLibroByEra);
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

## 🏗️ Entry point

### `index.js`

Punto de entrada de la aplicación. Vive en la raíz del proyecto, fuera de `src/`.

```js
require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/db');

const autorRoutes = require('./src/routes/autorRoutes');
const libroRoutes = require('./src/routes/libroRoutes');

const notFound = require('./src/middlewares/notFound');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

// Middlewares globales
app.use(express.json()); // parsea el body de los requests como JSON

// Rutas
app.use('/autores', autorRoutes);
app.use('/libros', libroRoutes);

// Middlewares de error (siempre al final)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});
```

> **Orden importa:** `notFound` va después de todas las rutas pero antes de `errorHandler`. Si lo ponés antes de las rutas, todas las requests van a devolver 404.

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

Solo levanta los servicios de base de datos. La app Node se corre por separado con `node index.js` o `nodemon`.

```yaml
services:
  mongodb:
    image: mongo:latest
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    ports:
      - "27017:27017"
    volumes:
      - ./mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "-u", "${MONGO_ROOT_USERNAME}", "-p", "${MONGO_ROOT_PASSWORD}", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - mongo-net

  mongo-express:
    image: mongo-express
    ports:
      - "8081:8081"
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: ${MONGO_ROOT_USERNAME}
      ME_CONFIG_MONGODB_ADMINPASSWORD: ${MONGO_ROOT_PASSWORD}
      ME_CONFIG_MONGODB_URL: mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/
      ME_CONFIG_BASICAUTH: "false"
      ME_CONFIG_BASICAUTH_USERNAME: ${ME_USERNAME}
      ME_CONFIG_BASICAUTH_PASSWORD: ${ME_PASSWORD}
    networks:
      - mongo-net

networks:
  mongo-net:

volumes:
  mongo_data:
```

---

## ▶️ Correr el proyecto

### Solo la base de datos con Docker

```bash
# Levantar MongoDB y Mongo Express leyendo variables del .env
docker compose --env-file .env up -d

# Detener los contenedores
docker compose down

# Detener y borrar el volumen de datos
docker compose down -v
```

Una vez que los contenedores estén corriendo, podés acceder a **Mongo Express** en `http://localhost:8081` para ver y administrar la base de datos visualmente.

### La app Node (en otra terminal)

```bash
# Desarrollo con recarga automática
npx nodemon index.js

# O sin nodemon
node index.js
```

---

## 🧪 Probar los endpoints

Con el servidor corriendo en `http://localhost:3001`:

### Autores

**Crear un autor**
```bash
curl -X POST http://localhost:3001/autores \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Gabriel García Márquez", "nacionalidad": "Colombia", "anioNacimiento": 1927}'
```

**Obtener todos los autores**
```bash
curl http://localhost:3001/autores
```

**Obtener autor por ID**
```bash
curl http://localhost:3001/autores/<id>
```

**Actualizar un autor**
```bash
curl -X PUT http://localhost:3001/autores/<id> \
  -H "Content-Type: application/json" \
  -d '{"nacionalidad": "Colombiana"}'
```

**Eliminar un autor**
```bash
curl -X DELETE http://localhost:3001/autores/<id>
```

---

### Libros

**Crear un libro** (el campo `autor` debe ser un `_id` válido de un autor existente)
```bash
curl -X POST http://localhost:3001/libros \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Cien años de soledad", "genero": "Realismo mágico", "anio": 1967, "autor": "<autor_id>"}'
```

**Obtener todos los libros** (incluye datos del autor via populate)
```bash
curl http://localhost:3001/libros
```

**Obtener libro por ID**
```bash
curl http://localhost:3001/libros/<id>
```

**Filtrar libros por era**
```bash
curl http://localhost:3001/libros/era/moderno
curl http://localhost:3001/libros/era/contemporáneo
curl http://localhost:3001/libros/era/antiguo
```

**Actualizar un libro**
```bash
curl -X PUT http://localhost:3001/libros/<id> \
  -H "Content-Type: application/json" \
  -d '{"genero": "Realismo"}'
```

**Eliminar un libro**
```bash
curl -X DELETE http://localhost:3001/libros/<id>
```

---

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

// $and: todas las condiciones se cumplen
await Libro.find({ $and: [{ anio: { $gte: 1900 } }, { genero: 'Realismo mágico' }] });
```

---

## ✏️ Operadores de actualización

En vez de reemplazar todo el documento, estos operadores modifican **solo los campos indicados**. Se usan dentro de `findByIdAndUpdate` o `updateMany`.

### `$set` — actualizar campos específicos

Sin `$set`, podés pisar campos que no querías tocar. Con `$set`, solo se modifican los campos indicados y el resto del documento queda intacto.

```js
// Sin $set: puede pisar campos que no querías tocar
await Libro.findByIdAndUpdate(id, { genero: 'Terror' });

// Con $set: solo actualiza genero, el resto no se toca
await Libro.findByIdAndUpdate(
  id,
  { $set: { genero: 'Terror' } },
  { new: true }
);

// Actualizar varios campos a la vez
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

// Agregar múltiples elementos con $each
await Libro.findByIdAndUpdate(
  id,
  { $push: { etiquetas: { $each: ['clásico', 'premiado'] } } },
  { new: true }
);
```

---

### `$pull` — eliminar un elemento de un array

```js
// Elimina todas las ocurrencias de 'best-seller' dentro del array
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

> | Operador | Para qué sirve |
> |---|---|
> | `$set` | Actualizar campos específicos sin tocar el resto |
> | `$inc` | Sumar o restar a un campo numérico |
> | `$push` | Agregar un elemento a un array |
> | `$pull` | Eliminar un elemento de un array |

---

## 🔗 Aggregation Pipeline

El **Aggregation Pipeline** es una herramienta de MongoDB para procesar documentos en etapas. Cada etapa recibe los documentos de la anterior, los transforma y los pasa a la siguiente. Se ejecuta con `Model.aggregate([...])`.

Es más potente que `find()` porque permite hacer joins, agrupaciones y cálculos directamente en la base de datos, sin traer todos los datos a Node primero.

```
Colección → $match → $lookup → $unwind → $group → $project → resultado
```

---

### `$match` — filtrar documentos

Equivalente al `WHERE` de SQL. Siempre conviene ponerlo **primero** para reducir la cantidad de documentos que procesan las etapas siguientes.

```js
// Libros publicados después de 1950
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
const resultado = await Libro.aggregate([
  {
    $lookup: {
      from: 'autors',       // nombre real de la colección en MongoDB
                            // Mongoose pluraliza 'Autor' → 'autors'
      localField: 'autor',  // campo en Libro que tiene el ObjectId
      foreignField: '_id',  // campo en autors que debe coincidir
      as: 'datosAutor',     // nombre del array que se agrega al documento
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

Convierte el array generado por `$lookup` en un objeto por elemento.

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
      _id: '$genero',      // campo por el que se agrupa (obligatorio)
      total: { $sum: 1 },  // suma 1 por cada documento del grupo
    },
  },
]);

// Resultado:
// [
//   { _id: 'Realismo mágico', total: 3 },
//   { _id: 'Terror', total: 5 }
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
      _id: 0,                                    // 0 = excluir
      titulo: 1,                                 // 1 = incluir
      anio: 1,
      tituloMayusculas: { $toUpper: '$titulo' }, // campo calculado
    },
  },
]);

// Resultado:
// [{ titulo: 'Cien años de soledad', anio: 1967, tituloMayusculas: 'CIEN AÑOS DE SOLEDAD' }]
```

---

### Pipeline completo — combinando todas las etapas

```js
const resultado = await Libro.aggregate([
  { $match: { anio: { $gte: 1900 } } },      // 1. filtrar por año
  {
    $lookup: {                                 // 2. join con autors
      from: 'autors',
      localField: 'autor',
      foreignField: '_id',
      as: 'datosAutor',
    },
  },
  { $unwind: '$datosAutor' },                 // 3. aplanar array a objeto
  {
    $project: {                               // 4. elegir y renombrar campos
      _id: 0,
      titulo: 1,
      anio: 1,
      autor: '$datosAutor.nombre',
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
> | Rendimiento | Queries extra por populate | Todo en una sola query en la BD |
> | Virtuals | ✅ disponibles | ✗ trabaja directo sobre MongoDB |

---

## 🗺️ Tabla de endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/autores` | Listar todos los autores |
| GET | `/autores/:id` | Obtener autor por ID |
| POST | `/autores` | Crear un autor |
| PUT | `/autores/:id` | Actualizar un autor |
| DELETE | `/autores/:id` | Eliminar un autor |
| GET | `/libros` | Listar libros (autor populado) |
| GET | `/libros/:id` | Obtener libro por ID |
| POST | `/libros` | Crear un libro |
| PUT | `/libros/:id` | Actualizar un libro |
| DELETE | `/libros/:id` | Eliminar un libro |
| GET | `/libros/era/:era` | Filtrar libros por era |

---

## 🔑 Conceptos clave

| Concepto | Descripción |
|---|---|
| `Schema` | Estructura, tipos y validaciones del documento |
| `Model` | Clase generada por Mongoose para operar la colección |
| `Controller` | Lógica de cada operación: recibe `req`, opera DB, envía `res` |
| `Route` | Asocia HTTP + path con su controller y middlewares |
| `Middleware` | Función `(req, res, next)` que corre antes del controller |
| `populate()` | Reemplaza un `ObjectId` por el documento referenciado |
| `virtual` | Campo calculado, no se guarda en MongoDB |
| `$lookup` | Join entre colecciones (Aggregation Pipeline) |
| `$match` | Filtro de documentos (Aggregation Pipeline) |
| `$group` | Agrupación y cálculos (Aggregation Pipeline) |