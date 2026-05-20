const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Song = require('../models/Song');
const Download = require('../models/Download');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Helper to get song IDs associated with a producer (self-uploaded or admin-uploaded with matching artistId)
const getProducerSongIds = async (userId) => {
  const user = await User.findById(userId);
  let songQuery = { uploadedBy: userId };
  if (user && user.artistId) {
    songQuery = {
      $or: [
        { uploadedBy: userId },
        { artistId: user.artistId }
      ]
    };
  }
  const songs = await Song.find(songQuery).select('_id');
  return songs.map(s => s._id);
};

exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    let totalRevenue = 0;
    let totalUsers = 0;
    let totalSongs = 0;
    let totalDownloads = 0;

    let songIds = [];
    if (req.user.role === 'producer') {
      songIds = await getProducerSongIds(req.user.id);
      const downloads = await Download.find({ songId: { $in: songIds } });

      totalSongs = songIds.length;
      totalDownloads = downloads.length;
      const uniqueUsers = new Set(downloads.map(d => d.userId.toString()));
      totalUsers = uniqueUsers.size;
      totalRevenue = 0;
    } else {
      const [revenueResult, usersCount, songsCount, downloadsCount] = await Promise.all([
        Subscription.aggregate([
          { $group: { _id: null, total: { $sum: '$price' } } },
        ]),
        User.countDocuments(),
        Song.countDocuments(),
        Download.countDocuments(),
      ]);
      totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
      totalUsers = usersCount;
      totalSongs = songsCount;
      totalDownloads = downloadsCount;
    }

    const matchStage = {};
    if (req.user.role === 'producer') {
      matchStage.songId = { $in: songIds };
    }

    const topSongs = await Download.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      { $group: { _id: '$songId', downloadCount: { $sum: 1 } } },
      { $sort: { downloadCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'songs',
          localField: '_id',
          foreignField: '_id',
          as: 'song',
        },
      },
      { $unwind: '$song' },
      { $project: { _id: 0, songId: '$_id', downloadCount: 1, title: '$song.title' } },
    ]);

    return successResponse(res, { totalRevenue, totalUsers, totalSongs, totalDownloads, topSongs });
  } catch (err) {
    next(err);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    if (req.user.role === 'producer') {
      const songIds = await getProducerSongIds(req.user.id);
      const downloads = await Download.find({ songId: { $in: songIds } });
      let totalRevenue = 0;

      const totalSongs = songIds.length;
      const totalDownloads = downloads.length;
      const uniqueUsers = new Set(downloads.map(d => d.userId.toString()));
      const totalUsers = uniqueUsers.size;

      return successResponse(res, { totalRevenue, totalUsers, totalSongs, totalDownloads });
    }

    const [revenueResult, totalUsers, totalSongs, totalDownloads] = await Promise.all([
      Subscription.aggregate([
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]),
      User.countDocuments(),
      Song.countDocuments(),
      Download.countDocuments(),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    return successResponse(res, { totalRevenue, totalUsers, totalSongs, totalDownloads });
  } catch (err) {
    next(err);
  }
};

exports.getTopSongs = async (req, res, next) => {
  try {
    const matchStage = {};
    if (req.user.role === 'producer') {
      const songIds = await getProducerSongIds(req.user.id);
      matchStage.songId = { $in: songIds };
    }

    const topSongs = await Download.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      { $group: { _id: '$songId', downloadCount: { $sum: 1 } } },
      { $sort: { downloadCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'songs',
          localField: '_id',
          foreignField: '_id',
          as: 'song',
        },
      },
      { $unwind: '$song' },
      { $project: { _id: 0, songId: '$_id', downloadCount: 1, title: '$song.title' } },
    ]);
    return successResponse(res, { topSongs });
  } catch (err) {
    next(err);
  }
};

exports.getRevenueByPeriod = async (req, res, next) => {
  try {
    const { period = 'day' } = req.query;
    let dateFormat;
    if (period === 'month') dateFormat = '%Y-%m';
    else if (period === 'week') dateFormat = '%Y-%U';
    else dateFormat = '%Y-%m-%d';

    if (req.user.role === 'producer') {
      // For producers, calculate downloaded songs daily revenue
      const songIds = await getProducerSongIds(req.user.id);
      const downloads = await Download.find({ songId: { $in: songIds } });
      const groups = {};
      
      downloads.forEach(d => {
        const dateStr = d.createdAt.toISOString().slice(0, period === 'month' ? 7 : 10); // Simple date format
        if (!groups[dateStr]) {
          groups[dateStr] = { total: 0, count: 0 };
        }
        groups[dateStr].count += 1;
      });

      const revenue = Object.entries(groups).map(([date, data]) => ({
        _id: date,
        total: 0,
        count: data.count
      })).sort((a, b) => a._id.localeCompare(b._id));

      return successResponse(res, { revenue, period });
    }

    const revenue = await Subscription.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          total: { $sum: '$price' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return successResponse(res, { revenue, period });
  } catch (err) {
    next(err);
  }
};

exports.getDownloadHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.user.role === 'producer') {
      const songIds = await getProducerSongIds(req.user.id);
      filter.songId = { $in: songIds };
    }

    const [downloads, total] = await Promise.all([
      Download.find(filter)
        .populate('userId', 'fullName email')
        .populate('songId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Download.countDocuments(filter),
    ]);

    return successResponse(res, { downloads }, 'Download history retrieved', 200, {
      page, limit, total, pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};
