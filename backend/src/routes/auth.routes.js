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

const { authenticate } = require('../middleware/auth.middleware');

router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/verify-otp', authLimiter, validateOtp, authController.verifyOtp);
router.post('/resend-otp', authLimiter, validateForgotPassword, authController.resendOtp);
router.post('/login', authLimiter, validateLogin, authController.login);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authLimiter, validateForgotPassword, authController.forgotPassword);
router.post('/verify-forgot-otp', authLimiter, validateOtp, authController.verifyForgotOtp);
router.post('/reset-password', authLimiter, validateResetPassword, authController.resetPassword);

module.exports = router;
