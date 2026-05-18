const { validationResult } = require('express-validator');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-passwordHash')
      .populate('purchasedSongs', 'title artistId price thumbnailId duration');
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, { user });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { fullName, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    return successResponse(res, { user }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    return successResponse(res, { users }, 'Users retrieved', 200, {
      page, limit, total, pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No image file provided', 400);

    const base64 = req.file.buffer.toString('base64');
    const avatarUrl = `data:${req.file.mimetype};base64,${base64}`;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl },
      { new: true }
    ).select('-passwordHash');

    if (!updated) return errorResponse(res, 'User not found', 404);

    return successResponse(res, { user: updated }, 'Avatar updated');
  } catch (err) {
    next(err);
  }
};
