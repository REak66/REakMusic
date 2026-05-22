const Genre = require('../models/Genre');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const slugify = (text) =>
  text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

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
    const { name, color } = req.body;
    const baseSlug = slugify(name || '');
    // ensure unique slug
    let slug = baseSlug;
    let count = 1;
    while (await Genre.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }
    const genre = await Genre.create({ name, color, slug });
    return successResponse(res, { genre }, 'Genre created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateGenre = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const update = { color };
    if (name) {
      update.name = name;
      update.slug = slugify(name);
    }
    const genre = await Genre.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
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
