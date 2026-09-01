const router = require('express').Router();
const c = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

const adminOnly = [requireAuth, requireRole('admin')];

router.get('/dashboard', ...adminOnly, c.getDashboard);
router.get('/workers', ...adminOnly, c.getAllWorkers);
router.get('/workers/pending', ...adminOnly, c.getPendingWorkers);
router.patch('/workers/:id/approve', ...adminOnly, c.approveWorker);
router.patch('/workers/:id/reject', ...adminOnly, c.rejectWorker);
router.get('/bookings', ...adminOnly, c.getAllBookings);
router.get('/demand/weekly', ...adminOnly, c.getWeeklyDemand);
router.get('/demand/heatmap', ...adminOnly, c.getHeatmap);
router.get('/demand/forecast', ...adminOnly, c.getForecast);
router.get('/workforce-recommendations', ...adminOnly, c.getWorkforceRecommendations);
router.get('/economics', ...adminOnly, c.getEconomics);
router.get('/welfare', ...adminOnly, c.getWelfare);
router.get('/analytics', ...adminOnly, c.getAnalytics);

module.exports = router;
