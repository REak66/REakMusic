const Album = require('../models/Album');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.listAlbums = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [albums, total] = await Promise.all([
      Album.find()
        .populate('artistId', 'name photo')
        .populate('genre', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Album.countDocuments(),
    ]);

    return successResponse(res, { albums }, 'Albums retrieved', 200, {
      page, limit, total, pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getAlbum = async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate('artistId', 'name photo bio country')
      .populate('genre', 'name slug');
    if (!album) return errorResponse(res, 'Album not found', 404);
    return successResponse(res, { album });
  } catch (err) {
    next(err);
  }
};

exports.createAlbum = async (req, res, next) => {
  try {
    const album = await Album.create(req.body);
    return successResponse(res, { album }, 'Album created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateAlbum = async (req, res, next) => {
  try {
    const album = await Album.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!album) return errorResponse(res, 'Album not found', 404);
    return successResponse(res, { album }, 'Album updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteAlbum = async (req, res, next) => {
  try {
    const album = await Album.findByIdAndDelete(req.params.id);
    if (!album) return errorResponse(res, 'Album not found', 404);
    return successResponse(res, null, 'Album deleted');
  } catch (err) {
    next(err);
  }
};
