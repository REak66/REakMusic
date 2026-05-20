const router = require('express').Router();
const multer = require('multer');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max (base64 stored in DB)
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG or WebP images are allowed'));
    }
  },
});

router.use(authenticate);
router.get('/', requirePermission('users:manage'), userController.listUsers);
router.post('/', requirePermission('users:manage'), userController.createUser);
router.patch('/:id', requirePermission('users:manage'), userController.updateUser);
router.delete('/:id', requirePermission('users:manage'), userController.deleteUser);
router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.post('/me/avatar', avatarUpload.single('avatar'), userController.uploadAvatar);

module.exports = router;
