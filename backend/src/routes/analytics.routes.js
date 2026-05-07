const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/rbac.middleware');

router.use(authenticate, isAdmin);
router.get('/summary', analyticsController.getSummary);
router.get('/top-songs', analyticsController.getTopSongs);
router.get('/revenue', analyticsController.getRevenueByPeriod);

module.exports = router;
