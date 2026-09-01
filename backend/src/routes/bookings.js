const router = require('express').Router();
const c = require('../controllers/bookingController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/', requireAuth, requireRole('customer'), c.createBooking);
router.get('/my', requireAuth, c.getMyBookings);
router.get('/:id', requireAuth, c.getBookingById);
router.patch('/:id/status', requireAuth, requireRole('worker'), c.updateBookingStatus);
router.post('/:id/accept', requireAuth, requireRole('worker'), c.acceptBooking);
router.post('/:id/reject', requireAuth, requireRole('worker'), c.rejectBooking);
router.post('/:id/payment', requireAuth, requireRole('customer'), c.confirmPayment);
router.post('/:id/rating', requireAuth, requireRole('customer'), c.rateBooking);
router.post('/:id/complaint', requireAuth, requireRole('customer'), c.fileComplaint);
router.post('/:id/warranty', requireAuth, requireRole('customer'), c.claimWarranty);
router.post('/:id/insurance', requireAuth, requireRole('customer'), c.claimInsurance);

module.exports = router;
