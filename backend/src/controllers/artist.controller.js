const { validationResult } = require('express-validator');
const Artist = require('../models/Artist');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.listArtists = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [artists, total] = await Promise.all([
      Artist.find().sort({ name: 1 }).skip(skip).limit(limit),
      Artist.countDocuments(),
    ]);

    return successResponse(res, { artists }, 'Artists retrieved', 200, {
      page, limit, total, pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getArtist = async (req, res, next) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return errorResponse(res, 'Artist not found', 404);
    return successResponse(res, { artist });
  } catch (err) {
    next(err);
  }
};

exports.createArtist = async (req, res, next) => {
  try {
    const artist = await Artist.create(req.body);
    return successResponse(res, { artist }, 'Artist created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateArtist = async (req, res, next) => {
  try {
    const artist = await Artist.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!artist) return errorResponse(res, 'Artist not found', 404);
    return successResponse(res, { artist }, 'Artist updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteArtist = async (req, res, next) => {
  try {
    const artist = await Artist.findByIdAndDelete(req.params.id);
    if (!artist) return errorResponse(res, 'Artist not found', 404);
    return successResponse(res, null, 'Artist deleted');
  } catch (err) {
    next(err);
  }
};
