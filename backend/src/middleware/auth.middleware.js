const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/apiResponse');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      req.user = decoded;
    } catch (err) {
      // Ignore invalid token in optional auth
    }
  }
  if (!req.user) {
    req.user = { role: 'guest' };
  }
  next();
};

module.exports = { authenticate, optionalAuth };
