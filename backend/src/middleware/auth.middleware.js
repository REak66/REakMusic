const { verifyToken } = require('../config/jwt');
const redisClient = require('../config/redis');
const { errorResponse } = require('../utils/apiResponse');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access token required', 401);
    }
    const token = authHeader.split(' ')[1];

    const blacklisted = await redisClient.get(`blacklist:${token}`);
    if (blacklisted) return errorResponse(res, 'Token has been invalidated', 401);

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];

    const blacklisted = await redisClient.get(`blacklist:${token}`);
    if (blacklisted) return next();

    const decoded = verifyToken(token);
    req.user = decoded;
  } catch (_) {
    // ignore errors for optional auth
  }
  next();
};

module.exports = { authenticate, optionalAuth };
