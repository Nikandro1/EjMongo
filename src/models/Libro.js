const mongoose = require("mongoose")

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