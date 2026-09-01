const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'under_review', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
