const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true },
    description: { type: String, required: true },
    claimedAmount: { type: Number, required: true, max: 5000 },
    approvedAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Approved', 'Rejected'],
      default: 'Approved', // Simulate for prototype
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);
