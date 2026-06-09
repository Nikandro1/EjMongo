const Libro = require("../models/Libro")

const getLibros = async(req,res)=>{
  try {
    const libros = await Libro.find().populate("autor")
    res.status(200).json(libros)
    if (!libros) {
      return res.status(404).json({ message: 'No se encontraron libros' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los libros' });
  }
}

const getLibroById = async(req, res)=>{
    try {
        const libro = await Libro.findById(req.params.id).populate("autor")
        if (!libro) {
            return res.status(404).json({ message: 'Libro no encontrado' });
        }
        res.status(200).json(libro)
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el libro' });
    }
}

const createLibro = async(req,res)=>{
  try {
    const libro = req.body
    const nuevoLibro = await Libro.create(libro)
    res.status(201).json(nuevoLibro)
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el libro' });
  }
}

const updateLibro = async(req,res)=>{
    try {
        const id = req.params.id
        const libro = await Libro.findByIdAndUpdate(
            id,
            req.body,
            {new: true}
        )
        res.status(200).json(libro)
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el libro' });
    }
}

const deleteLibro = async(req,res)=>{
    try {
        const id = req.params.id
        const libro = await Libro.findByIdAndDelete(id)
        if (!libro) {
            return res.status(404).json({ message: 'Libro no encontrado' });
        }
        res.status(200).json({ message: 'Libro eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el libro' });
    }
}

const getLibroByEra = async (req, res) => {
  try {
    const era = req.params.era;
    const validas = ['antiguo', 'moderno', 'contemporáneo', 'sin clasificar'];

    if (!validas.includes(era)) {
      return res.status(400).json({
        message: `Era inválida. Valores posibles: ${validas.join(', ')}`,
      });
    }
    const libros = await Libro.find().populate('autor', 'nombre');
    const resultado = libros.filter((libro) => libro.era === era);

    res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar libros por era' });
  }
};

module.exports = {getLibros, getLibroByEra, getLibroById, createLibro, updateLibro, deleteLibro}