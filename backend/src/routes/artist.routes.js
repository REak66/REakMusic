const router = require('express').Router();
const artistController = require('../controllers/artist.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/rbac.middleware');

router.get('/', artistController.listArtists);
router.get('/:id', artistController.getArtist);
router.post('/', authenticate, isAdmin, artistController.createArtist);
router.put('/:id', authenticate, isAdmin, artistController.updateArtist);
router.delete('/:id', authenticate, isAdmin, artistController.deleteArtist);

module.exports = router;
