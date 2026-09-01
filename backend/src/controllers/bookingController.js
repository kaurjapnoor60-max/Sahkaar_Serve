const Booking = require('../models/Booking');
const WorkerProfile = require('../models/WorkerProfile');
const Rating = require('../models/Rating');
const Complaint = require('../models/Complaint');
const WarrantyClaim = require('../models/WarrantyClaim');
const InsuranceClaim = require('../models/InsuranceClaim');
const bookingService = require('../services/bookingService');
const { WARRANTY_DAYS, MAX_INSURANCE_AMOUNT } = require('../config/constants');
const User = require('../models/User');

async function createBooking(req, res, next) {
  try {
    const { workerId, serviceName, subService, description, scheduledDate, scheduledTime,
      isEmergency, customerLocation, matchingScore, priority } = req.body;

    const customer = await User.findById(req.user.userId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const worker = await WorkerProfile.findById(workerId);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });

    const booking = await bookingService.createBooking({
      customerId: req.user.userId,
      customerName: customer.name,
      workerId,
      workerName: worker.name,
      serviceName, subService, description,
      scheduledDate, scheduledTime, isEmergency,
      customerLocation, matchingScore, priority,
    });

    // Update worker workload
    worker.currentWorkload = Math.min(100, (worker.currentWorkload || 0) + 10);
    worker.recentJobs = (worker.recentJobs || 0) + 1;
    await worker.save();

    res.status(201).json({ success: true, data: { booking } });
  } catch (err) { next(err); }
}

async function getMyBookings(req, res, next) {
  try {
    let bookings;
    if (req.user.role === 'customer') {
      bookings = await bookingService.getCustomerBookings(req.user.userId);
    } else if (req.user.role === 'worker') {
      const profile = await WorkerProfile.findOne({ userId: req.user.userId });
      if (!profile) return res.json({ success: true, data: { bookings: [] } });
      bookings = await bookingService.getWorkerJobs(profile._id);
    }
    res.json({ success: true, data: { bookings } });
  } catch (err) { next(err); }
}

async function getBookingById(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).lean();
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    res.json({ success: true, data: { booking } });
  } catch (err) { next(err); }
}

async function updateBookingStatus(req, res, next) {
  try {
    const { status } = req.body;
    const booking = await bookingService.updateBookingStatus(
      req.params.id, status, req.user.userId, req.user.role
    );
    res.json({ success: true, data: { booking } });
  } catch (err) { next(err); }
}

async function acceptBooking(req, res, next) {
  try {
    const booking = await bookingService.updateBookingStatus(
      req.params.id, 'ACCEPTED', req.user.userId, req.user.role
    );
    res.json({ success: true, data: { booking } });
  } catch (err) { next(err); }
}

async function rejectBooking(req, res, next) {
  try {
    const booking = await bookingService.updateBookingStatus(
      req.params.id, 'REJECTED', req.user.userId, req.user.role
    );
    res.json({ success: true, data: { booking } });
  } catch (err) { next(err); }
}

async function rateBooking(req, res, next) {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only the customer can rate this booking.' });
    }
    if (booking.status !== 'SERVICE_COMPLETED') {
      return res.status(400).json({ success: false, message: 'Booking must be completed before rating.' });
    }
    if (booking.ratingGiven) {
      return res.status(409).json({ success: false, message: 'Rating already submitted for this booking.' });
    }

    const existingRating = await Rating.findOne({ bookingId: booking._id });
    if (existingRating) return res.status(409).json({ success: false, message: 'Already rated.' });

    await Rating.create({
      bookingId: booking._id, customerId: req.user.userId,
      workerId: booking.workerId, rating, review,
    });

    booking.ratingGiven = true;
    await booking.save();

    // Update worker average rating
    const worker = await WorkerProfile.findById(booking.workerId);
    if (worker) {
      const newTotal = (worker.totalRatings || 0) + 1;
      const newRating = ((worker.rating || 0) * (worker.totalRatings || 0) + rating) / newTotal;
      worker.rating = Math.round(newRating * 10) / 10;
      worker.totalRatings = newTotal;
      await worker.save();
    }

    res.json({ success: true, data: { message: 'Rating submitted successfully.' } });
  } catch (err) { next(err); }
}

async function fileComplaint(req, res, next) {
  try {
    const { description } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only the customer can file a complaint.' });
    }
    const complaint = await Complaint.create({
      bookingId: booking._id, customerId: req.user.userId,
      workerId: booking.workerId, description,
    });
    booking.complaintFiled = true;
    await booking.save();
    res.status(201).json({ success: true, data: { complaint } });
  } catch (err) { next(err); }
}

async function claimWarranty(req, res, next) {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only the customer can claim warranty.' });
    }
    if (booking.status !== 'SERVICE_COMPLETED') {
      return res.status(400).json({ success: false, message: 'Booking must be completed.' });
    }

    // Check 3-day window
    const completedAt = booking.completedAt || booking.updatedAt;
    const warrantyExpiry = new Date(completedAt.getTime() + WARRANTY_DAYS * 24 * 60 * 60 * 1000);
    if (new Date() > warrantyExpiry) {
      return res.status(400).json({ success: false, message: `Warranty period of ${WARRANTY_DAYS} days has expired.` });
    }

    const claim = await WarrantyClaim.create({
      bookingId: booking._id, customerId: req.user.userId,
      workerId: booking.workerId, reason, expiresAt: warrantyExpiry,
    });
    booking.warrantyClaimed = true;
    await booking.save();
    res.status(201).json({ success: true, data: { claim, message: 'Warranty Claim Approved — Free Re-service will be scheduled.' } });
  } catch (err) { next(err); }
}

async function claimInsurance(req, res, next) {
  try {
    const { description, claimedAmount } = req.body;
    if (!claimedAmount || claimedAmount > MAX_INSURANCE_AMOUNT) {
      return res.status(400).json({ success: false, message: `Claimed amount must be ≤ ₹${MAX_INSURANCE_AMOUNT}.` });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only the customer can claim insurance.' });
    }

    const approvedAmount = Math.min(claimedAmount, MAX_INSURANCE_AMOUNT);
    const claim = await InsuranceClaim.create({
      bookingId: booking._id, customerId: req.user.userId,
      workerId: booking.workerId, description, claimedAmount, approvedAmount,
    });
    booking.insuranceClaimed = true;
    await booking.save();
    res.status(201).json({ success: true, data: { claim, approvedAmount } });
  } catch (err) { next(err); }
}

async function confirmPayment(req, res, next) {
  try {
    const { paymentMethod } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    booking.paymentStatus = 'paid';
    booking.paymentMethod = paymentMethod || 'UPI';
    booking.paidAt = new Date();
    await booking.save();
    res.json({ success: true, data: { booking } });
  } catch (err) { next(err); }
}

module.exports = { createBooking, getMyBookings, getBookingById, updateBookingStatus, acceptBooking, rejectBooking, rateBooking, fileComplaint, claimWarranty, claimInsurance, confirmPayment };
