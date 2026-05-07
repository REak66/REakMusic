const router = require('express').Router();
const genreController = require('../controllers/genre.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/rbac.middleware');

router.get('/', genreController.listGenres);
router.get('/:id', genreController.getGenre);
router.post('/', authenticate, isAdmin, genreController.createGenre);
router.put('/:id', authenticate, isAdmin, genreController.updateGenre);
router.delete('/:id', authenticate, isAdmin, genreController.deleteGenre);

module.exports = router;
