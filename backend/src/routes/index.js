const router = require('express').Router();
const mongoose = require('mongoose');

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/artists', require('./artist.routes'));
router.use('/albums', require('./album.routes'));
router.use('/songs', require('./song.routes'));
router.use('/genres', require('./genre.routes'));
router.use('/orders', require('./order.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/analytics', require('./analytics.routes'));

router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ success: true, db: dbStatus });
});

module.exports = router;
