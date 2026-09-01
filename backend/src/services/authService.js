const jwt = require('jsonwebtoken');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants');

function signToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function register(data) {
  const { name, phone, email, password, role, skills, primaryService, experience, serviceArea } = data;

  // Check if phone already exists for this role
  const existing = await User.findOne({ phone, role });
  if (existing) {
    const err = new Error('An account with this phone number already exists for this role.');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, phone, email, password, role });

  // If worker, create profile
  if (role === 'worker') {
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    await WorkerProfile.create({
      userId: user._id,
      name,
      phone,
      skills: Array.isArray(skills) ? skills : (skills || '').split(',').map((s) => s.trim()).filter(Boolean),
      primaryService: primaryService || (Array.isArray(skills) ? skills[0] : 'General'),
      experience: parseInt(experience) || 0,
      serviceArea: serviceArea || 'Swaroop Nagar, Kanpur',
      verificationStatus: 'pending',
      initials,
    });
  }

  const token = signToken(user._id, user.role);
  return { token, user };
}

async function login(data) {
  const { phone, email, password, role } = data;
  const identifier = phone || email;

  // Find by phone or email in the given role
  let user = null;
  if (phone) {
    user = await User.findOne({ phone, role }).select('+password');
  }
  if (!user && email) {
    user = await User.findOne({ email, role }).select('+password');
  }

  if (!user) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user._id, user.role);
  return { token, user };
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

module.exports = { register, login, getMe };
