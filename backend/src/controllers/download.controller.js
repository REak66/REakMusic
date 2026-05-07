const Song = require('../models/Song');
const User = require('../models/User');
const Download = require('../models/Download');
const driveService = require('../services/drive.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.download = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return errorResponse(res, 'Song not found', 404);

    const user = await User.findById(req.user.id);
    const owned = user.purchasedSongs.some((id) => id.toString() === song._id.toString());
    if (!owned) return errorResponse(res, 'You have not purchased this song', 403);

    if (!song.driveFileId) return errorResponse(res, 'File not available', 404);

    const signedUrl = await driveService.generateSignedUrl(song.driveFileId, 10);

    await Download.create({ userId: req.user.id, songId: song._id, ip: req.ip });
    await Song.findByIdAndUpdate(song._id, { $inc: { downloadCount: 1 } });

    return successResponse(res, { signedUrl }, 'Download URL generated');
  } catch (err) {
    next(err);
  }
};
