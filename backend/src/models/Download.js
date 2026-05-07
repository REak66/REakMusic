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

module.exports = mongoose.model('Download', downloadSchema);
