const Song = require('../models/Song');
const Download = require('../models/Download');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const mongoose = require('mongoose');
const driveService = require('../services/drive.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

function extractDriveFileId(link) {
  const m = link && link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

exports.listSongs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // If ownerOnly is requested, authentication is required
    if (req.query.ownerOnly === 'true') {
      if (!req.user) {
        return errorResponse(res, 'Authentication required to filter by owner', 401);
      }
      const user = await User.findById(req.user.id);
      if (user && user.artistId) {
        filter.$or = [
          { uploadedBy: new mongoose.Types.ObjectId(req.user.id) },
          { artistId: user.artistId }
        ];
      } else {
        filter.uploadedBy = new mongoose.Types.ObjectId(req.user.id);
      }
    }
    
    if (req.query.artistId) {
      filter.artistId = req.query.artistId;
    }
    if (req.query.albumId) {
      filter.albumId = req.query.albumId;
    }
    if (req.query.genre) {
      filter.genre = req.query.genre;
    }

    const [songs, total] = await Promise.all([
      Song.find(filter)
        .populate('artistId', 'name imageUrl')
        .populate('albumId', 'title coverImage')
        .populate('genre', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Song.countDocuments(filter),
    ]);

    return successResponse(res, { songs }, 'Songs retrieved', 200, {
      page, limit, total, pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.searchSongs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const { q, genre, year, sort } = req.query;

    const filter = {};
    if (q) filter.$text = { $search: q };
    if (genre) filter.genre = genre;
    if (year) filter.releaseYear = parseInt(year);

    let sortOption = { createdAt: -1 };
    if (sort === 'new') sortOption = { createdAt: -1 };
    else if (sort === 'top-downloads') sortOption = { downloadCount: -1 };
    else if (sort === 'trending') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const trending = await Download.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$songId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);
      const songIds = trending.map((t) => t._id);
      const songs = await Song.find({ _id: { $in: songIds } })
        .populate('artistId', 'name imageUrl')
        .populate('albumId', 'title coverImage')
        .populate('genre', 'name slug');
      const sorted = songIds.map((id) => songs.find((s) => s._id.toString() === id.toString())).filter(Boolean);
      const total = await Download.distinct('songId', { createdAt: { $gte: sevenDaysAgo } });
      return successResponse(res, { songs: sorted }, 'Search results', 200, {
        page, limit, total: total.length, pages: Math.ceil(total.length / limit),
      });
    }

    const [songs, total] = await Promise.all([
      Song.find(filter)
        .populate('artistId', 'name imageUrl')
        .populate('albumId', 'title coverImage')
        .populate('genre', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Song.countDocuments(filter),
    ]);

    return successResponse(res, { songs }, 'Search results', 200, {
      page, limit, total, pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id)
      .populate('artistId', 'name imageUrl bio country')
      .populate('albumId', 'title coverImage releaseYear')
      .populate('genre', 'name slug');
    if (!song) return errorResponse(res, 'Song not found', 404);
    return successResponse(res, { song });
  } catch (err) {
    next(err);
  }
};

exports.createSong = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      const fileId = await driveService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      body.driveFileId = fileId;
      body.driveLink = `https://drive.google.com/file/d/${fileId}/view`;
    } else if (body.driveLink && !body.driveFileId) {
      body.driveFileId = extractDriveFileId(body.driveLink);
    }
    if (req.user) {
      body.uploadedBy = req.user.id;
    }
    const song = await Song.create(body);
    return successResponse(res, { song }, 'Song created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateSong = async (req, res, next) => {
  try {
    const existing = await Song.findById(req.params.id);
    if (!existing) return errorResponse(res, 'Song not found', 404);

    if (req.user.role === 'producer') {
      const user = await User.findById(req.user.id);
      const isOwner = existing.uploadedBy && existing.uploadedBy.toString() === req.user.id.toString();
      const isLinkedArtist = user && user.artistId && existing.artistId && existing.artistId.toString() === user.artistId.toString();
      if (!isOwner && !isLinkedArtist) {
        return errorResponse(res, 'You are not authorized to manage this song', 403);
      }
    }

    const body = { ...req.body };
    if (req.file) {
      // Delete the old Drive file if one existed
      if (existing.driveFileId) {
        try { await driveService.deleteFile(existing.driveFileId); } catch (_) { /* ignore */ }
      }
      const fileId = await driveService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      body.driveFileId = fileId;
      body.driveLink = `https://drive.google.com/file/d/${fileId}/view`;
    } else if (body.driveLink && !body.driveFileId) {
      body.driveFileId = extractDriveFileId(body.driveLink);
    }
    const song = await Song.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    return successResponse(res, { song }, 'Song updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteSong = async (req, res, next) => {
  try {
    const existing = await Song.findById(req.params.id);
    if (!existing) return errorResponse(res, 'Song not found', 404);

    if (req.user.role === 'producer') {
      const user = await User.findById(req.user.id);
      const isOwner = existing.uploadedBy && existing.uploadedBy.toString() === req.user.id.toString();
      const isLinkedArtist = user && user.artistId && existing.artistId && existing.artistId.toString() === user.artistId.toString();
      if (!isOwner && !isLinkedArtist) {
        return errorResponse(res, 'You are not authorized to manage this song', 403);
      }
    }

    const song = await Song.findByIdAndDelete(req.params.id);
    if (song.driveFileId) {
      try { await driveService.deleteFile(song.driveFileId); } catch (_) { /* ignore */ }
    }
    return successResponse(res, null, 'Song deleted');
  } catch (err) {
    next(err);
  }
};

exports.streamSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return errorResponse(res, 'Song not found', 404);
    const fileId = song.driveFileId || extractDriveFileId(song.driveLink);
    if (!fileId) return errorResponse(res, 'Audio not available', 404);
    await driveService.streamFile(fileId, req, res);
  } catch (err) {
    next(err);
  }
};

exports.downloadSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return errorResponse(res, 'Song not found', 404);

    if (!song.driveFileId) return errorResponse(res, 'File not available for download', 404);

    // Verify user subscription status (admin and producer bypass this)
    if (req.user.role !== 'admin' && req.user.role !== 'producer') {
      const activeSubscription = await Subscription.findOne({
        userId: req.user.id,
        status: 'active',
        endDate: { $gt: new Date() },
      });
      if (!activeSubscription) {
        return errorResponse(res, 'An active subscription is required to download songs.', 403);
      }
    }

    await Download.create({ userId: req.user.id, songId: song._id, ip: req.ip });
    await Song.findByIdAndUpdate(song._id, { $inc: { downloadCount: 1 } });

    const filename = `${song.title}.mp3`;
    await driveService.streamFile(song.driveFileId, req, res, filename);
  } catch (err) {
    next(err);
  }
};

exports.resolveDriveLink = async (req, res, next) => {
  try {
    const { link } = req.query;
    if (!link) return errorResponse(res, 'Link parameter required', 400);

    const fileId = extractDriveFileId(link);
    if (!fileId) return errorResponse(res, 'Invalid Google Drive link format', 400);

    const fileInfo = await driveService.getFileInfo(fileId);
    return successResponse(res, { name: fileInfo.name }, 'Link resolved successfully');
  } catch (err) {
    console.error('resolveDriveLink error details:', err);
    return errorResponse(res, 'Unable to resolve Google Drive link. Ensure the file is shared as "Anyone with the link can view".', 404);
  }
};

