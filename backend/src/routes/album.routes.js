const router = require('express').Router();
const albumController = require('../controllers/album.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/rbac.middleware');

router.get('/', albumController.listAlbums);
router.get('/:id', albumController.getAlbum);
router.post('/', authenticate, isAdmin, albumController.createAlbum);
router.put('/:id', authenticate, isAdmin, albumController.updateAlbum);
router.delete('/:id', authenticate, isAdmin, albumController.deleteAlbum);

module.exports = router;
