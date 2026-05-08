const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/', isAdmin, userController.listUsers);
router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.get('/me/orders', userController.getMyOrders);

module.exports = router;
