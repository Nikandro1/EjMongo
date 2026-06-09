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

libroSchema.virtual('era').get(function () {
  if (!this.anio) return 'sin clasificar';
  if (this.anio < 1800) return 'antiguo';
  if (this.anio < 1950) return 'moderno';
  return 'contemporáneo';
});

const Libro = mongoose.model('Libro', libroSchema);

module.exports = Libro;