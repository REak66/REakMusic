const { errorResponse } = require('../utils/apiResponse');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return errorResponse(res, 'Unauthorized', 401);
  if (!roles.includes(req.user.role)) return errorResponse(res, 'Forbidden', 403);
  next();
};

const isAdmin = requireRole('admin');

module.exports = { requireRole, isAdmin };
