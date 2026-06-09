const mongoose = require("mongoose")

const autorSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true
    },
    nacionalidad: {
      type: String,
    },
    anioNacimiento: {
      type: Number
    },
  },
  {
    timestamps: true,
  }
);
const Autor = mongoose.model('Autor', autorSchema);

module.exports = Autor;