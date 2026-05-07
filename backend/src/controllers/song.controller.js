const Song = require('../models/Song');
const Download = require('../models/Download');
const User = require('../models/User');
const driveService = require('../services/drive.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.listSongs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [songs, total] = await Promise.all([
      Song.find()
        .populate('artistId', 'name photo')
        .populate('albumId', 'title coverImage')
        .populate('genre', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Song.countDocuments(),
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
    const { q, genre, minPrice, maxPrice, year, sort } = req.query;

    const filter = {};
    if (q) filter.$text = { $search: q };
    if (genre) filter.genre = genre;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }
    if (year) filter.releaseYear = parseInt(year);

    let sortOption = { createdAt: -1 };
    if (sort === 'new') sortOption = { createdAt: -1 };
    else if (sort === 'top-downloads') sortOption = { downloadCount: -1 };
    else if (sort === 'price-asc') sortOption = { price: 1 };
    else if (sort === 'price-desc') sortOption = { price: -1 };
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
        .populate('artistId', 'name photo')
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
        .populate('artistId', 'name photo')
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
      .populate('artistId', 'name photo bio country')
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
    const song = await Song.create(req.body);
    return successResponse(res, { song }, 'Song created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateSong = async (req, res, next) => {
  try {
    const song = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!song) return errorResponse(res, 'Song not found', 404);
    return successResponse(res, { song }, 'Song updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteSong = async (req, res, next) => {
  try {
    const song = await Song.findByIdAndDelete(req.params.id);
    if (!song) return errorResponse(res, 'Song not found', 404);
    return successResponse(res, null, 'Song deleted');
  } catch (err) {
    next(err);
  }
};

exports.downloadSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return errorResponse(res, 'Song not found', 404);

    const user = await User.findById(req.user.id);
    const owned = user.purchasedSongs.some((id) => id.toString() === song._id.toString());
    if (!owned) return errorResponse(res, 'You have not purchased this song', 403);

    if (!song.driveFileId) return errorResponse(res, 'File not available for download', 404);

    const signedUrl = await driveService.generateSignedUrl(song.driveFileId, 10);

    await Download.create({ userId: req.user.id, songId: song._id, ip: req.ip });
    await Song.findByIdAndUpdate(song._id, { $inc: { downloadCount: 1 } });

    return successResponse(res, { signedUrl }, 'Download URL generated');
  } catch (err) {
    next(err);
  }
};
