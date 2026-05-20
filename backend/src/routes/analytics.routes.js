const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');

router.use(authenticate, requirePermission('analytics:view'));
router.get('/', analyticsController.getDashboardAnalytics);
router.get('/summary', analyticsController.getSummary);
router.get('/top-songs', analyticsController.getTopSongs);
router.get('/revenue', analyticsController.getRevenueByPeriod);
router.get('/download-history', analyticsController.getDownloadHistory);

module.exports = router;
