const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    color: { type: String, default: '#7c3aed' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Genre', genreSchema);
