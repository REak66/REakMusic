const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Song = require('../models/Song');
const Download = require('../models/Download');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Helper to get song IDs associated with a producer (self-uploaded or admin-uploaded with matching artistId)
const getProducerSongIds = async (userId) => {
  // B4: Optimize query by selecting only artistId instead of whole User document
  const user = await User.findById(userId).select('artistId');
  let songQuery = { uploadedBy: userId };
  if (user && user.artistId) {
    songQuery = {
      $or: [
        { uploadedBy: userId },
        { artistId: user.artistId }
      ]
    };
  }
  // Use distinct which returns a flat array of ObjectIds directly and is highly optimized by MongoDB indexes
  return await Song.distinct('_id', songQuery);
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
      totalSongs = songIds.length;

      // B6: Use MongoDB aggregation to compute total downloads and unique user count
      // This avoids loading all download documents into memory (very expensive)
      if (totalSongs > 0) {
        const stats = await Download.aggregate([
          { $match: { songId: { $in: songIds } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              uniqueUsers: { $addToSet: '$userId' }
            }
          }
        ]);
        if (stats.length > 0) {
          totalDownloads = stats[0].total;
          totalUsers = stats[0].uniqueUsers.length;
        }
      }
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
      const totalSongs = songIds.length;
      let totalDownloads = 0;
      let totalUsers = 0;
      let totalRevenue = 0;

      // B6: Optimize by counting via aggregation instead of loading all Download docs into memory
      if (totalSongs > 0) {
        const stats = await Download.aggregate([
          { $match: { songId: { $in: songIds } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              uniqueUsers: { $addToSet: '$userId' }
            }
          }
        ]);
        if (stats.length > 0) {
          totalDownloads = stats[0].total;
          totalUsers = stats[0].uniqueUsers.length;
        }
      }

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
      const songIds = await getProducerSongIds(req.user.id);
      
      // B11: Replace slow in-memory JS grouping of all Download documents with direct MongoDB aggregation
      if (songIds.length === 0) {
        return successResponse(res, { revenue: [], period });
      }

      const revenue = await Download.aggregate([
        { $match: { songId: { $in: songIds } } },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            total: { $sum: 0 }, // Downloads don't have direct price, so total is 0
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

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
