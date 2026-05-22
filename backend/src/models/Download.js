const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
    ip: String,
  },
  { timestamps: true }
);

downloadSchema.index({ songId: 1, userId: 1 });
downloadSchema.index({ createdAt: -1 }); // for trending, revenue-by-period, and history sort
downloadSchema.index({ songId: 1, createdAt: -1 }); // for producer-scoped date range queries

module.exports = mongoose.model('Download', downloadSchema);
