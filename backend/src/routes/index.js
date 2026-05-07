const router = require('express').Router();
const mongoose = require('mongoose');
const redisClient = require('../config/redis');

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/artists', require('./artist.routes'));
router.use('/albums', require('./album.routes'));
router.use('/songs', require('./song.routes'));
router.use('/genres', require('./genre.routes'));
router.use('/orders', require('./order.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/analytics', require('./analytics.routes'));

router.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let redisStatus = 'disconnected';
  try {
    await redisClient.ping();
    redisStatus = 'connected';
  } catch (_) {}
  res.json({ success: true, db: dbStatus, redis: redisStatus });
});

module.exports = router;
