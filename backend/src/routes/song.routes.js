const router = require('express').Router();
const multer = require('multer');
const songController = require('../controllers/song.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { requireRole, requirePermission } = require('../middleware/rbac.middleware');

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/x-flac', 'audio/x-wav'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'songFile' && !ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only audio files are allowed'));
    }
    cb(null, true);
  },
});

router.get('/', optionalAuth, songController.listSongs);
router.get('/search', songController.searchSongs);
router.get('/resolve-drive', songController.resolveDriveLink);
router.get('/:id', songController.getSong);
router.get('/:id/stream', songController.streamSong);
router.get('/:id/download', authenticate, songController.downloadSong);
router.post('/', authenticate, requirePermission('songs:create'), upload.single('songFile'), songController.createSong);
router.put('/:id', authenticate, requirePermission('songs:update'), upload.single('songFile'), songController.updateSong);
router.delete('/:id', authenticate, requirePermission('songs:delete'), songController.deleteSong);

module.exports = router;
