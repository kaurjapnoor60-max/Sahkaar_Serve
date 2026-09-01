const mongoose = require('mongoose');

const warrantyClaimSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['Submitted', 'Approved', 'Re-service Scheduled', 'Rejected'],
      default: 'Approved', // Simulate instant approval for prototype
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WarrantyClaim', warrantyClaimSchema);
