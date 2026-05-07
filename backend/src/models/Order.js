const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'expired', 'refunded'], default: 'pending' },
    khqrRef: String,
    qrCode: String,
    expiresAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ status: 1 });
orderSchema.index({ userId: 1 });

module.exports = mongoose.model('Order', orderSchema);
