const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
    releaseYear: Number,
    coverImage: String,
    description: String,
    genre: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Album', albumSchema);
