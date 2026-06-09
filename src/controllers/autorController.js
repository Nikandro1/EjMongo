const Autor = require("../models/Autor")

const getAutores = async(req, res)=>{
    try{
        const autores = await Autor.find()
        if(!autores){
            res.status(404).json({message: "No se encontraron autores"})
        }
        res.status(200).json(autores)
    }catch(error){
        res.status(500).json(e.message)
    }
}

const getAutorById = async(req,res)=>{
    try{ 
    const id = req.params.id
    const autor = await Autor.findById(id)
    if(!autor){
            res.status(404).json({message: "No se encontraron autores"})
        }
        res.status(200).json(autor)
    }catch(error){
        res.status(500).json(e.message)
    }
}

const createAutor = async(req,res)=>{
    try{ 
    const id = req.body
    const autor = await Autor.create(id)
    if(!autor){
        res.status(404).json({message: "Error al crear autor"})
    }
    res.status(201).json(autor)
    }catch(error){
        res.status(500).json(e.message)
    }
}

const updateAutor = async(req,res)=>{
    try{
        const id = req.params.id
        const autor = await Autor.findByIdAndUpdate(id,
            req.body,
        {new: true})
        if(!autor){
            res.status(404).json({message: "Error al actualizar autor"})
        }
        res.status(200).json(autor)
    }catch(e){
        res.status(500).json(e.message)
    }
}

const deleteAutor = async(req,res)=>{
    try{
        const id = req.params.id
        const autor = await Autor.findByIdAndDelete(id)
        if(!autor){
            res.status(404).json({message:"Error al eliminar un Autor"})
        }
        res.status(200).json(autor)
    }catch(e){
        res.status(500).json(e.message)
    }
}

module.exports = {getAutores, getAutorById, createAutor, updateAutor, deleteAutor }