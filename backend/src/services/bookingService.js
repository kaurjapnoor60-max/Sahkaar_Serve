const Booking = require('../models/Booking');
const WorkerProfile = require('../models/WorkerProfile');
const { VALID_TRANSITIONS } = require('../config/constants');
const notificationService = require('./notificationService');
const { calculatePricing } = require('./pricingService');

async function createBooking(data) {
  const {
    customerId, customerName, workerId, workerName,
    serviceName, subService, description,
    scheduledDate, scheduledTime, isEmergency,
    customerLocation, matchingScore, priority,
  } = data;

  const pricing = calculatePricing(serviceName, isEmergency);

  const booking = await Booking.create({
    customerId,
    customerName,
    workerId,
    workerName,
    serviceName,
    subService,
    description,
    scheduledDate: isEmergency ? null : scheduledDate,
    scheduledTime: isEmergency ? null : scheduledTime,
    isEmergency,
    customerLocation,
    matchingScore: matchingScore || 80,
    priority: isEmergency ? 'Critical' : (priority || 'Normal'),
    ...pricing,
    status: 'REQUESTED',
    timeline: [{ status: 'REQUESTED', time: new Date(), note: 'Booking created' }],
  });

  // Find the worker's userId to send notification
  const workerProfile = await WorkerProfile.findById(workerId);
  if (workerProfile) {
    await notificationService.notifyNewBooking(workerProfile.userId, serviceName, booking._id);
  }

  return booking;
}

async function updateBookingStatus(bookingId, newStatus, actorId, actorRole) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found.');
    err.statusCode = 404;
    throw err;
  }

  const currentStatus = booking.status;
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowedNext.includes(newStatus)) {
    const err = new Error(`Invalid status transition: ${currentStatus} → ${newStatus}`);
    err.statusCode = 400;
    throw err;
  }

  // Role enforcement: only workers can change most statuses
  if (['ACCEPTED', 'ON_THE_WAY', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'REJECTED'].includes(newStatus)) {
    if (actorRole !== 'worker' && actorRole !== 'admin') {
      const err = new Error('Only the assigned worker can update booking status.');
      err.statusCode = 403;
      throw err;
    }
  }

  booking.status = newStatus;
  booking.timeline.push({ status: newStatus, time: new Date() });

  if (newStatus === 'SERVICE_COMPLETED') {
    booking.completedAt = new Date();
    // Update worker stats
    const worker = await WorkerProfile.findById(booking.workerId);
    if (worker) {
      worker.completedJobs = (worker.completedJobs || 0) + 1;
      worker.earnings.total = (worker.earnings.total || 0) + booking.workerEarnings;
      worker.earnings.monthly = (worker.earnings.monthly || 0) + booking.workerEarnings;
      worker.earnings.weekly = (worker.earnings.weekly || 0) + booking.workerEarnings;
      worker.earnings.today = (worker.earnings.today || 0) + booking.workerEarnings;
      worker.currentWorkload = Math.max(0, (worker.currentWorkload || 0) - 10);
      await worker.save();
    }
  }

  await booking.save();

  // Fire notifications
  const worker = await WorkerProfile.findById(booking.workerId).lean();
  const workerName = worker?.name || 'Your worker';

  if (newStatus === 'ACCEPTED') {
    await notificationService.notifyBookingAccepted(booking.customerId, workerName, booking._id);
  } else if (newStatus === 'REJECTED') {
    await notificationService.notifyBookingRejected(booking.customerId, workerName, booking._id);
  } else if (newStatus === 'ON_THE_WAY') {
    await notificationService.notifyOnTheWay(booking.customerId, workerName, booking._id);
  } else if (newStatus === 'SERVICE_STARTED') {
    await notificationService.notifyServiceStarted(booking.customerId, workerName, booking._id);
  } else if (newStatus === 'SERVICE_COMPLETED') {
    await notificationService.notifyServiceCompleted(booking.customerId, workerName, booking._id);
  }

  return booking;
}

async function getCustomerBookings(customerId) {
  return Booking.find({ customerId }).sort({ createdAt: -1 }).lean();
}

async function getWorkerJobs(workerId) {
  return Booking.find({ workerId }).sort({ createdAt: -1 }).lean();
}

module.exports = { createBooking, updateBookingStatus, getCustomerBookings, getWorkerJobs };
