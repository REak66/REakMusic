const router = require('express').Router();
const artistController = require('../controllers/artist.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { validateArtist } = require('../utils/validators');

router.get('/', artistController.listArtists);
router.get('/:id', artistController.getArtist);
router.post('/', authenticate, isAdmin, validateArtist, validate, artistController.createArtist);
router.put('/:id', authenticate, isAdmin, validateArtist, validate, artistController.updateArtist);
router.delete('/:id', authenticate, isAdmin, artistController.deleteArtist);

module.exports = router;
