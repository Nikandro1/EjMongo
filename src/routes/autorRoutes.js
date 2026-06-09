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