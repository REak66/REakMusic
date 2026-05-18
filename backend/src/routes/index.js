const router = require('express').Router();
const mongoose = require('mongoose');

// Telegram webhook — no auth, must come before other middleware
router.post('/telegram/webhook', require('../controllers/telegram.controller').handleWebhook);

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/artists', require('./artist.routes'));
router.use('/albums', require('./album.routes'));
router.use('/songs', require('./song.routes'));
router.use('/genres', require('./genre.routes'));
router.use('/subscriptions', require('./subscription.routes'));
router.use('/analytics', require('./analytics.routes'));

router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ success: true, db: dbStatus });
});

module.exports = router;
