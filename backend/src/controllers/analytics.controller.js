const Order = require('../models/Order');
const User = require('../models/User');
const Song = require('../models/Song');
const Download = require('../models/Download');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getSummary = async (req, res, next) => {
  try {
    const [revenueResult, totalUsers, totalSongs] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      User.countDocuments(),
      Song.countDocuments(),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    return successResponse(res, { totalRevenue, totalUsers, totalSongs });
  } catch (err) {
    next(err);
  }
};

exports.getTopSongs = async (req, res, next) => {
  try {
    const topSongs = await Download.aggregate([
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
      { $project: { _id: 0, songId: '$_id', downloadCount: 1, title: '$song.title', price: '$song.price' } },
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

    const revenue = await Order.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          total: { $sum: '$totalPrice' },
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
