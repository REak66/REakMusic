const router = require('express').Router();
const genreController = require('../controllers/genre.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const isMusicManager = requireRole('admin');

router.get('/', genreController.listGenres);
router.get('/:id', genreController.getGenre);
router.post('/', authenticate, isMusicManager, genreController.createGenre);
router.put('/:id', authenticate, isMusicManager, genreController.updateGenre);
router.delete('/:id', authenticate, isMusicManager, genreController.deleteGenre);

module.exports = router;
