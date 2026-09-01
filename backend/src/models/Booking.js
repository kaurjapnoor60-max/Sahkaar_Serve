const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, unique: true }, // e.g. SS1041
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    serviceName: { type: String, required: true },
    subService: { type: String, default: '' },
    description: { type: String, default: '' },
    scheduledDate: { type: String, default: null }, // null = emergency/immediate
    scheduledTime: { type: String, default: null },
    isEmergency: { type: Boolean, default: false },
    customerLocation: { type: String, required: true },
    workerLocation: { type: String, default: '' },
    status: {
      type: String,
      enum: ['REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'REJECTED', 'CANCELLED'],
      default: 'REQUESTED',
    },
    // Pricing
    basePrice: { type: Number, required: true },
    cooperativeContribution: { type: Number, default: 0 },
    welfareContribution: { type: Number, default: 0 },
    damageInsurancePremium: { type: Number, default: 0 },
    workerEarnings: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    // Payment
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paymentMethod: { type: String, default: null },
    paidAt: { type: Date, default: null },
    // Matching
    matchingScore: { type: Number, default: 0 },
    priority: { type: String, enum: ['Low', 'Normal', 'High', 'Critical'], default: 'Normal' },
    // Timeline
    timeline: [
      {
        status: String,
        time: { type: Date, default: Date.now },
        note: String,
      },
    ],
    // Customer name snapshot
    customerName: { type: String, default: '' },
    workerName: { type: String, default: '' },
    // Flags
    warrantyClaimed: { type: Boolean, default: false },
    insuranceClaimed: { type: Boolean, default: false },
    ratingGiven: { type: Boolean, default: false },
    complaintFiled: { type: Boolean, default: false },
    rejectionReason: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-generate booking reference
bookingSchema.pre('save', async function (next) {
  if (!this.bookingRef) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingRef = `SS${1000 + count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
