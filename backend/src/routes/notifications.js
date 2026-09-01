const router = require('express').Router();
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getNotifications);
router.patch('/:id/read', requireAuth, markRead);
router.patch('/all/read', requireAuth, markAllRead);

module.exports = router;
