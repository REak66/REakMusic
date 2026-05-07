const router = require('express').Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.post('/checkout', orderController.checkout);
router.get('/:id', orderController.getOrder);

module.exports = router;
