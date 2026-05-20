const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
    albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
    genre: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
    duration: Number,
    previewUrl: String,
    driveFileId: String,
    driveLink: String,
    thumbnailId: String,
    downloadCount: { type: Number, default: 0 },
    releaseYear: Number,
    description: String,
    isFeatured: { type: Boolean, default: false },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

songSchema.index({ title: 'text' });
songSchema.index({ downloadCount: -1 });

module.exports = mongoose.model('Song', songSchema);
