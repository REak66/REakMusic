const router = require('express').Router();
const songController = require('../controllers/song.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/rbac.middleware');

router.get('/', songController.listSongs);
router.get('/search', songController.searchSongs);
router.get('/:id', songController.getSong);
router.get('/:id/download', authenticate, songController.downloadSong);
router.post('/', authenticate, isAdmin, songController.createSong);
router.put('/:id', authenticate, isAdmin, songController.updateSong);
router.delete('/:id', authenticate, isAdmin, songController.deleteSong);

module.exports = router;
