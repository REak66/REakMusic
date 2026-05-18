const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const {
  validateRegister,
  validateLogin,
  validateOtp,
  validateForgotPassword,
  validateResetPassword,
} = require('../utils/validators');

router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/verify-otp', authLimiter, validateOtp, authController.verifyOtp);
router.post('/login', authLimiter, validateLogin, authController.login);
router.get('/me', authController.me);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, validateForgotPassword, authController.forgotPassword);
router.post('/verify-forgot-otp', authLimiter, validateOtp, authController.verifyForgotOtp);
router.post('/reset-password', authLimiter, validateResetPassword, authController.resetPassword);

module.exports = router;
