const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyToken } = require('../config/jwt');
const redisClient = require('../config/redis');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const telegramService = require('../services/telegram.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000,
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { fullName, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return errorResponse(res, 'Email already registered', 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ fullName, email, passwordHash, phone, isVerified: false });

    const otp = await otpService.generateOtp(email, 'otp:register');
    await emailService.sendOtpEmail(email, otp);

    return successResponse(res, { userId: user._id }, 'Registration successful. Check your email for OTP.', 201);
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { email, otp } = req.body;

    const locked = await otpService.isLocked(email, 'otp:register');
    if (locked) return errorResponse(res, 'Too many attempts. Please request a new OTP.', 429);

    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 'User not found', 404);

    const valid = await otpService.verifyOtp(email, otp, 'otp:register');
    if (!valid) {
      const attempts = await otpService.incrementAttempts(email, 'otp:register');
      if (attempts >= otpService.MAX_ATTEMPTS) {
        await otpService.lockOtp(email, 'otp:register', 600);
      }
      return errorResponse(res, 'Invalid OTP', 400);
    }

    user.isVerified = true;
    await user.save();
    await otpService.deleteOtp(email, 'otp:register');

    return successResponse(res, null, 'Email verified successfully');
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { email, password } = req.body;
    const failKey = `login_fail:${email}`;

    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 'Invalid credentials', 401);
    if (!user.isVerified) return errorResponse(res, 'Please verify your email first', 403);

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return errorResponse(res, 'Account locked. Check your email to unlock.', 423);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const fails = await redisClient.incr(failKey);
      await redisClient.expire(failKey, 3600);

      if (fails >= 3) {
        user.lockedUntil = new Date(Date.now() + 3600 * 1000);
        await user.save();
        const unlockToken = crypto.randomBytes(32).toString('hex');
        await redisClient.set(`unlock:${unlockToken}`, email, { EX: 3600 });
        await emailService.sendAccountUnlockEmail(email, unlockToken);
        await telegramService.notifyAdmin(`⚠️ Account locked after 3 failed attempts: <b>${email}</b>`);
        return errorResponse(res, 'Account locked due to too many failed attempts. Check your email.', 423);
      }

      return errorResponse(res, 'Invalid credentials', 401);
    }

    await redisClient.del(failKey);
    user.lockedUntil = null;
    user.failedAttempts = 0;
    await user.save();

    const payload = { id: user._id, role: user.role, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return successResponse(res, { accessToken, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return errorResponse(res, 'Refresh token required', 401);

    const blacklisted = await redisClient.get(`blacklist:${token}`);
    if (blacklisted) return errorResponse(res, 'Token invalidated', 401);

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return errorResponse(res, 'User not found', 401);

    const accessToken = signAccessToken({ id: decoded.id, role: decoded.role, email: decoded.email });
    return successResponse(res, { accessToken, user }, 'Token refreshed');
  } catch (err) {
    return errorResponse(res, 'Invalid or expired refresh token', 401);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const decoded = verifyToken(token);
        const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
        if (ttl > 0) await redisClient.set(`blacklist:${token}`, '1', { EX: ttl });
      } catch (_) {}
    }
    res.clearCookie('refreshToken');
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return successResponse(res, null, 'If an account exists, an OTP has been sent.');

    const otp = await otpService.generateOtp(email, 'otp:forgot');
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

    const locked = await otpService.isLocked(email, 'otp:forgot');
    if (locked) return errorResponse(res, 'Too many attempts. Request a new OTP.', 429);

    const valid = await otpService.verifyOtp(email, otp, 'otp:forgot');
    if (!valid) {
      const attempts = await otpService.incrementAttempts(email, 'otp:forgot');
      if (attempts >= otpService.MAX_ATTEMPTS) await otpService.lockOtp(email, 'otp:forgot', 600);
      return errorResponse(res, 'Invalid OTP', 400);
    }

    await otpService.deleteOtp(email, 'otp:forgot');
    const resetToken = crypto.randomBytes(32).toString('hex');
    await redisClient.set(`reset:${resetToken}`, email, { EX: 900 });

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
    const email = await redisClient.get(`reset:${resetToken}`);
    if (!email) return errorResponse(res, 'Invalid or expired reset token', 400);

    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 'User not found', 404);

    user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    await redisClient.del(`reset:${resetToken}`);

    await redisClient.set(`pwdreset:${user._id}`, Date.now().toString(), { EX: 86400 });

    return successResponse(res, null, 'Password reset successful.');
  } catch (err) {
    next(err);
  }
};
