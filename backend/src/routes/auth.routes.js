const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const validate = require('../middleware/validate.middleware');
const {
  validateRegister,
  validateLogin,
  validateOtp,
  validateForgotPassword,
  validateResetPassword,
} = require('../utils/validators');

const { authenticate } = require('../middleware/auth.middleware');

router.post('/register', authLimiter, validateRegister, validate, authController.register);
router.post('/verify-otp', authLimiter, validateOtp, validate, authController.verifyOtp);
router.post('/resend-otp', authLimiter, validateForgotPassword, validate, authController.resendOtp);
router.post('/login', authLimiter, validateLogin, validate, authController.login);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authLimiter, validateForgotPassword, validate, authController.forgotPassword);
router.post('/verify-forgot-otp', authLimiter, validateOtp, validate, authController.verifyForgotOtp);
router.post('/reset-password', authLimiter, validateResetPassword, validate, authController.resetPassword);

module.exports = router;
