const bcrypt = require('bcrypt');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');


exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-passwordHash')
      .populate('purchasedSongs', 'title artistId thumbnailId duration');
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, { user });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
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

exports.createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, role, artistId, permissions } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return errorResponse(res, 'Email already registered', 409);

    const defaultPermissions = {
      admin: ['songs:create', 'songs:update', 'songs:delete', 'analytics:view', 'downloads:all', 'users:manage'],
      producer: ['songs:create', 'songs:update', 'songs:delete', 'analytics:view'],
      customer: ['downloads:all'],
      guest: [],
      guest_user: [],
    };

    const userPermissions = permissions || defaultPermissions[role] || [];

    const newUser = new User({
      fullName,
      email,
      passwordHash: password ? await bcrypt.hash(password, 12) : undefined,
      phone,
      role,
      artistId,
      permissions: userPermissions,
      isVerified: true,
    });

    await newUser.save();
    return successResponse(res, { message: 'User created successfully', user: newUser });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { fullName, email, phone, role, artistId, isVerified, permissions } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email, phone, role, artistId, isVerified, permissions },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return errorResponse(res, 'User not found', 404);

    return successResponse(res, { message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      return errorResponse(res, 'You cannot delete yourself', 400);
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return errorResponse(res, 'User not found', 404);

    return successResponse(res, { message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};
