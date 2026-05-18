const mongoose = require('mongoose');

const PLAN_PRICES = { weekly: 0.99, monthly: 4.99 };
const PLAN_DAYS = { weekly: 7, monthly: 30 };

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['weekly', 'monthly'], required: true },
    status: { type: String, enum: ['pending', 'active', 'expired', 'cancelled', 'rejected'], default: 'pending' },
    startDate: { type: Date },
    endDate: { type: Date },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
Subscription.PLAN_PRICES = PLAN_PRICES;
Subscription.PLAN_DAYS = PLAN_DAYS;

Subscription.PLAN_DAYS = PLAN_DAYS;
Subscription.PLAN_PRICES = PLAN_PRICES;
module.exports = Subscription;
