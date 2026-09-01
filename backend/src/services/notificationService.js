const Notification = require('../models/Notification');

async function createNotification({ userId, type = 'info', title, message, bookingId = null }) {
  try {
    await Notification.create({ userId, type, title, message, bookingId });
  } catch (err) {
    console.error('Notification create error:', err.message);
  }
}

async function notifyBookingAccepted(customerId, workerName, bookingId) {
  await createNotification({
    userId: customerId,
    type: 'success',
    title: 'Worker Accepted',
    message: `${workerName} has accepted your service request. They will be on their way soon.`,
    bookingId,
  });
}

async function notifyBookingRejected(customerId, workerName, bookingId) {
  await createNotification({
    userId: customerId,
    type: 'warning',
    title: 'Worker Unavailable',
    message: `${workerName} has declined your request. Please select another available worker.`,
    bookingId,
  });
}

async function notifyOnTheWay(customerId, workerName, bookingId) {
  await createNotification({
    userId: customerId,
    type: 'info',
    title: 'Worker On the Way',
    message: `${workerName} is on their way to your location.`,
    bookingId,
  });
}

async function notifyServiceStarted(customerId, workerName, bookingId) {
  await createNotification({
    userId: customerId,
    type: 'info',
    title: 'Service Started',
    message: `${workerName} has started your service.`,
    bookingId,
  });
}

async function notifyServiceCompleted(customerId, workerName, bookingId) {
  await createNotification({
    userId: customerId,
    type: 'success',
    title: 'Service Completed',
    message: `${workerName} has completed your service. Please rate your experience.`,
    bookingId,
  });
}

async function notifyNewBooking(workerId, serviceName, bookingId) {
  await createNotification({
    userId: workerId,
    type: 'booking',
    title: 'New Service Request',
    message: `You have a new ${serviceName} service request. Accept or reject within 15 minutes.`,
    bookingId,
  });
}

module.exports = {
  createNotification,
  notifyBookingAccepted,
  notifyBookingRejected,
  notifyOnTheWay,
  notifyServiceStarted,
  notifyServiceCompleted,
  notifyNewBooking,
};
