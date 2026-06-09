const { Router } = require('express');
const {
  getLibros,
  getLibroById,
  createLibro,
  updateLibro,
  deleteLibro,
  getLibroByEra,
} = require('../controllers/libroController');
const validateObjectId = require('../middlewares/validateObjectId');

const router = Router();


router.get('/era/:era', getLibroByEra);
router.get('/', getLibros);
router.get('/:id', validateObjectId, getLibroById);
router.post('/', createLibro);
router.put('/:id', validateObjectId, updateLibro);
router.delete('/:id', validateObjectId, deleteLibro);

module.exports = router;