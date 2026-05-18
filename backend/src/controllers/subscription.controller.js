const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { notifySubscriptionRequest } = require('../services/telegram.service');

const { PLAN_PRICES, PLAN_DAYS } = Subscription;

exports.subscribe = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!['weekly', 'monthly'].includes(plan)) {
      return errorResponse(res, 'Invalid plan. Choose weekly or monthly.', 400);
    }

    const existing = await Subscription.findOne({
      userId: req.user.id,
      status: { $in: ['pending', 'active'] },
    });
    if (existing) {
      if (existing.status === 'pending') {
        return errorResponse(res, 'You already have a pending subscription request.', 409);
      }
      if (existing.status === 'active') {
        const daysRemaining = (new Date(existing.endDate) - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysRemaining > 7) {
          const daysUntilWindow = Math.ceil(daysRemaining - 7);
          return errorResponse(
            res,
            `Renewal window not open yet. You can renew in ${daysUntilWindow} day(s).`,
            409
          );
        }
        // Within 7 days of expiry — allow renewal
      }
    }

    const subscription = await Subscription.create({
      userId: req.user.id,
      plan,
      status: 'pending',
      price: PLAN_PRICES[plan],
    });

    const user = await User.findById(req.user.id).select('fullName email');
    await notifySubscriptionRequest(subscription, user);

    return successResponse(res, { subscription }, 'Subscription request submitted. Awaiting admin approval.', 201);
  } catch (err) {
    next(err);
  }
};

exports.getMySubscription = async (req, res, next) => {
  try {
    let subscription = await Subscription.findOne({
      userId: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() },
    }).sort({ endDate: -1 });

    if (!subscription) {
      subscription = await Subscription.findOne({
        userId: req.user.id,
        status: 'pending',
      }).sort({ createdAt: -1 });
    }

    return successResponse(res, { subscription: subscription || null });
  } catch (err) {
    next(err);
  }
};

exports.cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user.id,
      status: { $in: ['active', 'pending'] },
    });

    if (!subscription) {
      return errorResponse(res, 'No active or pending subscription found.', 404);
    }

    if (subscription.status === 'active') {
      const daysSinceStart = (Date.now() - new Date(subscription.startDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceStart > 7) {
        return errorResponse(
          res,
          'Cancellation window has expired. Subscriptions can only be cancelled within 7 days of activation.',
          403
        );
      }
    }

    subscription.status = 'cancelled';
    await subscription.save();

    return successResponse(res, { subscription }, 'Subscription cancelled');
  } catch (err) {
    next(err);
  }
};

exports.approveSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findOne({ _id: id, status: 'pending' });
    if (!subscription) {
      return errorResponse(res, 'Pending subscription not found.', 404);
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + PLAN_DAYS[subscription.plan] * 24 * 60 * 60 * 1000);
    subscription.status = 'active';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    await subscription.save();

    return successResponse(res, { subscription }, 'Subscription approved');
  } catch (err) {
    next(err);
  }
};

exports.rejectSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { status: 'rejected' },
      { new: true }
    );

    if (!subscription) {
      return errorResponse(res, 'Pending subscription not found.', 404);
    }

    return successResponse(res, { subscription }, 'Subscription rejected');
  } catch (err) {
    next(err);
  }
};

exports.listSubscriptions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      Subscription.find()
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Subscription.countDocuments(),
    ]);

    return successResponse(res, { subscriptions, total, page, limit });
  } catch (err) {
    next(err);
  }
};

