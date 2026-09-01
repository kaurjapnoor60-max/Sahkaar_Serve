const router = require('express').Router();
const {
  getWorkers,
  getWorkerById,
  getMyProfile,
  updateMyProfile,
  getMyJobs,
  getMyEarnings,
  getMonthlyEarnings,
  updateAvailability,
} = require('../controllers/workerController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', getWorkers);
router.get('/me', requireAuth, requireRole('worker'), getMyProfile);
router.patch('/me', requireAuth, requireRole('worker'), updateMyProfile);
router.get('/me/jobs', requireAuth, requireRole('worker'), getMyJobs);
router.get('/me/earnings', requireAuth, requireRole('worker'), getMyEarnings);
router.get('/me/earnings/monthly', requireAuth, requireRole('worker'), getMonthlyEarnings);
router.patch('/me/availability', requireAuth, requireRole('worker'), updateAvailability);
router.get('/:id', getWorkerById);

module.exports = router;
