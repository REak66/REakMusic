const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const telegramService = require('../services/telegram.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// In-memory stores for transient auth data
const loginFailStore = new Map(); // email -> { count, expiresAt }
const unlockTokenStore = new Map(); // token -> { email, expiresAt }
const resetTokenStore = new Map(); // token -> { email, expiresAt }

const _storeSet = (map, key, value, ttlSeconds) => {
  map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
};

const _storeGet = (map, key) => {
  const item = map.get(key);
  if (!item) return null;
  if (item.expiresAt < Date.now()) { map.delete(key); return null; }
  return item.value;
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { fullName, email, password, phone, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return errorResponse(res, 'Email already registered', 409);

    // Sanitize role to prevent registering as admin
    let userRole = 'customer';
    if (role && ['customer', 'producer', 'guest', 'guest_user'].includes(role)) {
      userRole = role;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Assign default permissions based on role
    const defaultPermissions = {
      admin: ['songs:create', 'songs:update', 'songs:delete', 'analytics:view', 'downloads:all', 'users:manage'],
      producer: ['songs:create', 'songs:update', 'songs:delete', 'analytics:view'],
      customer: ['downloads:all'],
      guest: [],
      guest_user: [],
    };
    const permissions = defaultPermissions[userRole] || [];

    let artistId = undefined;
    if (userRole === 'producer') {
      const Artist = require('../models/Artist');
      const artist = await Artist.create({ name: fullName });
      artistId = artist._id;
    }

    const newUser = new User({
      fullName,
      email,
      passwordHash,
      phone,
      role: userRole,
      permissions,
    });

    await newUser.save();

    // Generate and send OTP for registration
    try {
      const otp = otpService.generateOtp(email, 'otp:register');
      console.log(`\n🔑 [DEV ONLY] Generated registration OTP for ${email}: ${otp}\n`);
      await emailService.sendOtpEmail(email, otp);
    } catch (emailErr) {
      console.error('Error sending registration OTP email:', emailErr);
    }

    return successResponse(res, { message: 'Registration successful' });
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { email, otp } = req.body;

    const locked = otpService.isLocked(email, 'otp:register');
    if (locked) return errorResponse(res, 'Too many attempts. Please request a new OTP.', 429);

    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 'User not found', 404);

    const valid = otpService.verifyOtp(email, otp, 'otp:register');
    if (!valid) {
      const attempts = otpService.incrementAttempts(email, 'otp:register');
      if (attempts >= otpService.MAX_ATTEMPTS) {
        otpService.lockOtp(email, 'otp:register', 600);
      }
      return errorResponse(res, 'Invalid OTP', 400);
    }

    user.isVerified = true;
    await user.save();
    otpService.deleteOtp(email, 'otp:register');

    return successResponse(res, null, 'Email verified successfully');
  } catch (err) {
    next(err);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 'User not found', 404);
    if (user.isVerified) return errorResponse(res, 'Email already verified', 400);

    const locked = otpService.isLocked(email, 'otp:register');
    if (locked) return errorResponse(res, 'Too many requests. Please wait a few minutes.', 429);

    const otp = otpService.generateOtp(email, 'otp:register');
    console.log(`\n🔑 [DEV ONLY] Resent registration OTP for ${email}: ${otp}\n`);
    await emailService.sendOtpEmail(email, otp);

    return successResponse(res, null, 'OTP resent successfully');
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 'Invalid credentials', 401);
    if (!user.isVerified) return errorResponse(res, 'Please verify your email first', 403);

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return errorResponse(res, 'Account locked. Check your email to unlock.', 423);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const failData = loginFailStore.get(email) || { count: 0 };
      failData.count += 1;
      failData.expiresAt = Date.now() + 3600 * 1000;
      loginFailStore.set(email, failData);

      if (failData.count >= 3) {
        user.lockedUntil = new Date(Date.now() + 3600 * 1000);
        await user.save();
        loginFailStore.delete(email);
        const unlockToken = crypto.randomBytes(32).toString('hex');
        _storeSet(unlockTokenStore, unlockToken, email, 3600);
        await emailService.sendAccountUnlockEmail(email, unlockToken);
        await telegramService.notifyAdmin(`⚠️ Account locked after 3 failed attempts: <b>${email}</b>`);
        return errorResponse(res, 'Account locked due to too many failed attempts. Check your email.', 423);
      }

      return errorResponse(res, 'Invalid credentials', 401);
    }

    loginFailStore.delete(email);
    user.lockedUntil = null;
    user.failedAttempts = 0;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return successResponse(res, { token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    if (!req.user) return errorResponse(res, 'Not authenticated', 401);
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, user, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res, next) => {
  return successResponse(res, null, 'Logged out successfully');
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return successResponse(res, null, 'If an account exists, an OTP has been sent.');

    const otp = otpService.generateOtp(email, 'otp:forgot');
    await emailService.sendOtpEmail(email, otp);

    return successResponse(res, null, 'OTP sent to your email.');
  } catch (err) {
    next(err);
  }
};

exports.verifyForgotOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { email, otp } = req.body;

    const locked = otpService.isLocked(email, 'otp:forgot');
    if (locked) return errorResponse(res, 'Too many attempts. Request a new OTP.', 429);

    const valid = otpService.verifyOtp(email, otp, 'otp:forgot');
    if (!valid) {
      const attempts = otpService.incrementAttempts(email, 'otp:forgot');
      if (attempts >= otpService.MAX_ATTEMPTS) otpService.lockOtp(email, 'otp:forgot', 600);
      return errorResponse(res, 'Invalid OTP', 400);
    }

    otpService.deleteOtp(email, 'otp:forgot');
    const resetToken = crypto.randomBytes(32).toString('hex');
    _storeSet(resetTokenStore, resetToken, email, 900);

    return successResponse(res, { resetToken }, 'OTP verified.');
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { resetToken, password } = req.body;
    const email = _storeGet(resetTokenStore, resetToken);
    if (!email) return errorResponse(res, 'Invalid or expired reset token', 400);

    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 'User not found', 404);

    user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    resetTokenStore.delete(resetToken);

    return successResponse(res, null, 'Password reset successful.');
  } catch (err) {
    next(err);
  }
};
