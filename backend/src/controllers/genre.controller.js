const Genre = require('../models/Genre');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.listGenres = async (req, res, next) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    return successResponse(res, { genres });
  } catch (err) {
    next(err);
  }
};

exports.getGenre = async (req, res, next) => {
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return errorResponse(res, 'Genre not found', 404);
    return successResponse(res, { genre });
  } catch (err) {
    next(err);
  }
};

exports.createGenre = async (req, res, next) => {
  try {
    const genre = await Genre.create(req.body);
    return successResponse(res, { genre }, 'Genre created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateGenre = async (req, res, next) => {
  try {
    const genre = await Genre.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!genre) return errorResponse(res, 'Genre not found', 404);
    return successResponse(res, { genre }, 'Genre updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteGenre = async (req, res, next) => {
  try {
    const genre = await Genre.findByIdAndDelete(req.params.id);
    if (!genre) return errorResponse(res, 'Genre not found', 404);
    return successResponse(res, null, 'Genre deleted');
  } catch (err) {
    next(err);
  }
};
