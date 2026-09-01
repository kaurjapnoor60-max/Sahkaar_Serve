const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    profileImage: { type: String, default: null },
    skills: [{ type: String }],
    primaryService: { type: String, required: true },
    experience: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    serviceArea: { type: String, default: 'Swaroop Nagar, Kanpur' },
    latitude: { type: Number, default: 26.4499 },
    longitude: { type: Number, default: 80.3319 },
    availability: { type: Boolean, default: true },
    availableNow: { type: Boolean, default: true },
    currentWorkload: { type: Number, default: 0, min: 0, max: 100 },
    recentJobs: { type: Number, default: 0 },
    baseRate: { type: Number, default: 300 },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    cooperative: { type: String, default: 'Bharat Seva Cooperative' },
    cooperativeMember: { type: Boolean, default: true },
    distanceKm: { type: Number, default: 2.0 },
    earnings: {
      today: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    welfareContribution: { type: Number, default: 0 },
    coopContribution: { type: Number, default: 0 },
    benefits: {
      healthInsurance: { type: Boolean, default: true },
      accidentCover: { type: Boolean, default: true },
      lifeInsurance: { type: Boolean, default: true },
      welfareContribution: { type: Boolean, default: true },
      savingsFund: { type: Boolean, default: true },
    },
    avatarColor: { type: String, default: 'bg-primary-600' },
    initials: { type: String, default: '' },
    certifications: [{ type: String }],
    monthlyEarnings: [
      {
        month: String,
        year: Number,
        amount: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
