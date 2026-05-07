const { validationResult } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
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

exports.getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId: req.user.id })
        .populate('songs', 'title artistId price thumbnailId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ userId: req.user.id }),
    ]);

    return successResponse(res, { orders }, 'Orders retrieved', 200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};
