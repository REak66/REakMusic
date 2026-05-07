const Song = require('../models/Song');
const Order = require('../models/Order');
const khqrService = require('../services/khqr.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.checkout = async (req, res, next) => {
  try {
    const { songIds } = req.body;
    if (!Array.isArray(songIds) || songIds.length === 0) {
      return errorResponse(res, 'Song IDs required', 400);
    }

    const songs = await Song.find({ _id: { $in: songIds } });
    if (songs.length !== songIds.length) {
      return errorResponse(res, 'One or more songs not found', 404);
    }

    const totalPrice = songs.reduce((sum, s) => sum + s.price, 0);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const order = await Order.create({
      userId: req.user.id,
      songs: songs.map((s) => s._id),
      totalPrice,
      expiresAt,
      status: 'pending',
    });

    try {
      const { qrCode, ref } = await khqrService.createQR(order._id, totalPrice);
      order.qrCode = qrCode;
      order.khqrRef = ref;
      await order.save();
    } catch (khqrErr) {
      console.error('KHQR error:', khqrErr.message);
    }

    return successResponse(res, { order }, 'Order created', 201);
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('songs', 'title artistId price thumbnailId');
    if (!order) return errorResponse(res, 'Order not found', 404);
    if (order.userId.toString() !== req.user.id) return errorResponse(res, 'Forbidden', 403);
    return successResponse(res, { order });
  } catch (err) {
    next(err);
  }
};
