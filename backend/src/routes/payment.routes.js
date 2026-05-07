const router = require('express').Router();
const paymentController = require('../controllers/payment.controller');

router.post('/callback', paymentController.callback);

module.exports = router;
