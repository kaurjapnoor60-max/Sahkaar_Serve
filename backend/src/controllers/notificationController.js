const Notification = require('../models/Notification');

async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 }).limit(50).lean();
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true, data: { message: 'Marked as read.' } });
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ userId: req.user.userId }, { read: true });
    res.json({ success: true, data: { message: 'All notifications marked as read.' } });
  } catch (err) { next(err); }
}

module.exports = { getNotifications, markRead, markAllRead };
