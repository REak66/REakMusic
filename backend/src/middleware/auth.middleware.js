const { errorResponse } = require('../utils/apiResponse');

const authenticate = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return errorResponse(res, 'Authentication required', 401);
  }
  req.user = req.session.user;
  next();
};

const optionalAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
};

module.exports = { authenticate, optionalAuth };
