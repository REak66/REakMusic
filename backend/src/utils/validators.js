const { body } = require('express-validator');

// --- Auth Validators ---

exports.validateRegister = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, digit, and special character'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];

exports.validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.validateOtp = [
  body('otp').matches(/^\d{6}$/).withMessage('OTP must be 6 digits'),
];

exports.validateForgotPassword = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

exports.validateResetPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, digit, and special character'),
  body('resetToken').notEmpty().withMessage('Reset token is required'),
];

// --- Genre Validators ---

exports.validateGenre = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Genre name is required and must be under 100 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code (e.g. #7c3aed or #fff)'),
];

// --- Artist / Producer Validators ---

exports.validateArtist = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Artist/producer name is required'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),
  body('socialLinks')
    .optional()
    .isArray()
    .withMessage('Social links must be an array of link structures'),
  body('socialLinks.*.platform')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Social link platform cannot be empty'),
  body('socialLinks.*.url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Social link must be a valid URL'),
];

// --- User Management Validators ---

exports.validateCreateUser = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('role')
    .optional()
    .isIn(['guest', 'guest_user', 'customer', 'admin', 'producer'])
    .withMessage('Invalid user role'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array of permission strings'),
];

exports.validateUpdateUser = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('role')
    .optional()
    .isIn(['guest', 'guest_user', 'customer', 'admin', 'producer'])
    .withMessage('Invalid user role'),
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be a boolean value'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array of permission strings'),
];

exports.validateUpdateMe = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];
