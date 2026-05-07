const Order = require('../models/Order');
const User = require('../models/User');
const khqrService = require('../services/khqr.service');
const emailService = require('../services/email.service');
const telegramService = require('../services/telegram.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.callback = async (req, res, next) => {
  try {
    const signature = req.headers['x-khqr-signature'] || req.headers['x-signature'];
    if (signature && !khqrService.verifyWebhookSignature(req.body, signature)) {
      return errorResponse(res, 'Invalid signature', 401);
    }

    const { transaction_ref, status } = req.body;
    if (status !== 'SUCCESS' && status !== 'PAID') {
      return successResponse(res, null, 'Acknowledged');
    }

    const order = await Order.findOne({ khqrRef: transaction_ref });
    if (!order) return errorResponse(res, 'Order not found', 404);

    if (order.status === 'paid') return successResponse(res, null, 'Already processed');

    order.status = 'paid';
    await order.save();

    await User.findByIdAndUpdate(order.userId, {
      $addToSet: { purchasedSongs: { $each: order.songs } },
    });

    const user = await User.findById(order.userId).select('email');
    if (user) {
      await emailService.sendPurchaseConfirmationEmail(user.email, order).catch(() => {});
    }

    await telegramService.notifyAdmin(
      `✅ Payment received!\nOrder: <b>${order._id}</b>\nAmount: <b>$${order.totalPrice.toFixed(2)}</b>`
    );

    return successResponse(res, null, 'Payment processed');
  } catch (err) {
    next(err);
  }
};
