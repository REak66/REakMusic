const { errorResponse } = require('../utils/apiResponse');

const requireRole = (...roles) => (req, res, next) => {
  const userRole = req.user ? req.user.role : 'guest';
  if (!roles.includes(userRole)) {
    if (!req.user) return errorResponse(res, 'Unauthorized', 401);
    return errorResponse(res, 'Forbidden', 403);
  }
  next();
};

const requirePermission = (permission) => async (req, res, next) => {
  if (!req.user) return errorResponse(res, 'Unauthorized', 401);
  
  // Admin role automatically bypasses all permission checks
  if (req.user.role === 'admin') return next();

  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (user && user.permissions && user.permissions.includes(permission)) {
      return next();
    }
    return errorResponse(res, 'Forbidden: Insufficient Permissions', 403);
  } catch (err) {
    next(err);
  }
};

const isAdmin = requireRole('admin');

module.exports = { requireRole, requirePermission, isAdmin };
