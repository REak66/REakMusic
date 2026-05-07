const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bio: String,
    photo: String,
    country: String,
    socialLinks: [{ platform: String, url: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Artist', artistSchema);
