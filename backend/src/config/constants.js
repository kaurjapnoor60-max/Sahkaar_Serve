// ─── JWT ────────────────────────────────────────────────────────────────────
const JWT_EXPIRES_IN = '7d';
const JWT_SECRET = process.env.JWT_SECRET || 'sahkaar_serve_secret';

// ─── PRICING (percentages of base price) ────────────────────────────────────
const PRICING = {
  WORKER_EARNINGS_PCT: 0.82,       // 82% to worker
  COOP_OPERATIONS_PCT: 0.10,       // 10% cooperative operations
  WELFARE_CONTRIBUTION_PCT: 0.06,  // 6% welfare fund
  DAMAGE_INSURANCE_PCT: 0.02,      // 2% damage insurance premium
};

// ─── BASE PRICES (₹) ────────────────────────────────────────────────────────
const BASE_PRICES = {
  Plumbing: 300,
  Electrical: 250,
  Cleaning: 350,
  Househelp: 300,
  Carpentry: 400,
  'Appliance Repair': 450,
  Painting: 500,
  Gardening: 200,
  Driving: 150,
  Caregiving: 350,
  'Technical Services': 400,
};

const EMERGENCY_MULTIPLIER = 1.5;

// ─── INSURANCE ──────────────────────────────────────────────────────────────
const MAX_INSURANCE_AMOUNT = 5000;
const WARRANTY_DAYS = 3;

// ─── BOOKING STATUS ──────────────────────────────────────────────────────────
const BOOKING_STATUS = {
  REQUESTED: 'REQUESTED',
  ACCEPTED: 'ACCEPTED',
  ON_THE_WAY: 'ON_THE_WAY',
  SERVICE_STARTED: 'SERVICE_STARTED',
  SERVICE_COMPLETED: 'SERVICE_COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

const VALID_TRANSITIONS = {
  REQUESTED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY: ['SERVICE_STARTED', 'CANCELLED'],
  SERVICE_STARTED: ['SERVICE_COMPLETED', 'CANCELLED'],
  SERVICE_COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

// ─── VERIFICATION ────────────────────────────────────────────────────────────
const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// ─── AREAS ───────────────────────────────────────────────────────────────────
const AREAS = [
  'Swaroop Nagar, Kanpur',
  'Civil Lines, Kanpur',
  'Kakadeo, Kanpur',
  'Kidwai Nagar, Kanpur',
  'Govind Nagar, Kanpur',
  'Arya Nagar, Kanpur',
  'Shastri Nagar, Kanpur',
  'Kalyanpur, Kanpur',
];

module.exports = {
  JWT_EXPIRES_IN,
  JWT_SECRET,
  PRICING,
  BASE_PRICES,
  EMERGENCY_MULTIPLIER,
  MAX_INSURANCE_AMOUNT,
  WARRANTY_DAYS,
  BOOKING_STATUS,
  VALID_TRANSITIONS,
  VERIFICATION_STATUS,
  AREAS,
};
