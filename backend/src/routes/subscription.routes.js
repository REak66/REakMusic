const router = require('express').Router();
const ctrl = require('../controllers/subscription.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/rbac.middleware');

router.post('/', authenticate, ctrl.subscribe);
router.get('/me', authenticate, ctrl.getMySubscription);
router.delete('/me', authenticate, ctrl.cancelSubscription);
router.patch('/:id/approve', authenticate, isAdmin, ctrl.approveSubscription);
router.patch('/:id/reject', authenticate, isAdmin, ctrl.rejectSubscription);
router.get('/', authenticate, isAdmin, ctrl.listSubscriptions);

module.exports = router;
