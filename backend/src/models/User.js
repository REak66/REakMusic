const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['guest', 'guest_user', 'customer', 'admin', 'producer'], default: 'customer' },
    isVerified: { type: Boolean, default: false },
    purchasedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    avatarUrl: { type: String, default: null },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }, // Link producer to their artist profile
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
