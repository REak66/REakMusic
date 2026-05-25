const router = require('express').Router();
const genreController = require('../controllers/genre.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { validateGenre } = require('../utils/validators');

const isMusicManager = requireRole('admin');

router.get('/', genreController.listGenres);
router.get('/:id', genreController.getGenre);
router.post('/', authenticate, isMusicManager, validateGenre, validate, genreController.createGenre);
router.put('/:id', authenticate, isMusicManager, validateGenre, validate, genreController.updateGenre);
router.delete('/:id', authenticate, isMusicManager, genreController.deleteGenre);

module.exports = router;
