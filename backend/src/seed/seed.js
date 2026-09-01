require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

const SERVICES_DATA = [
  { name: 'Plumbing', icon: 'Droplets', desc: 'Pipes, taps, leaks, fittings', baseCost: 300, color: 'text-secondary-600', bg: 'bg-secondary-50', subServices: ['Pipe Repair', 'Tap Fitting', 'Drainage Cleaning', 'Geyser Installation', 'Leak Detection'], keywords: ['pipe', 'tap', 'drain', 'leak', 'geyser'] },
  { name: 'Electrical', icon: 'Zap', desc: 'Wiring, switches, repairs', baseCost: 250, color: 'text-accent-600', bg: 'bg-accent-50', subServices: ['Wiring Repair', 'Switch Replacement', 'Fan Installation', 'Inverter Setup', 'MCB Repair'], keywords: ['switch', 'wire', 'light', 'fan', 'electrical'] },
  { name: 'Cleaning', icon: 'Sparkles', desc: 'Home, deep, move-in/out cleaning', baseCost: 350, color: 'text-primary-600', bg: 'bg-primary-50', subServices: ['Deep Cleaning', 'Kitchen Sanitization', 'Move-in Cleaning', 'Regular Cleaning'], keywords: ['clean', 'dust', 'mop', 'sanitize'] },
  { name: 'Househelp', icon: 'HeartHandshake', desc: 'Daily domestic help, cooking, maid services', baseCost: 300, color: 'text-pink-600', bg: 'bg-pink-50', subServices: ['Daily Help', 'Cooking Help', 'Utensil Cleaning', 'Full-Time Maid'], keywords: ['maid', 'domestic', 'cook', 'helper', 'household'] },
  { name: 'Carpentry', icon: 'Hammer', desc: 'Furniture, doors, fixtures', baseCost: 400, color: 'text-amber-700', bg: 'bg-amber-50', subServices: ['Furniture Repair', 'Door Fitting', 'Modular Work', 'Cabinet Work'], keywords: ['door', 'furniture', 'wood', 'cabinet'] },
  { name: 'Appliance Repair', icon: 'Wrench', desc: 'AC, fridge, washing machine, appliances', baseCost: 450, color: 'text-slate-700', bg: 'bg-slate-100', subServices: ['AC Service', 'Refrigerator Repair', 'Washing Machine Repair', 'General Appliance Repair'], keywords: ['ac', 'fridge', 'appliance', 'washing machine'] },
  { name: 'Painting', icon: 'PaintbrushVertical', desc: 'Walls, interiors, exteriors', baseCost: 500, color: 'text-rose-600', bg: 'bg-rose-50', subServices: ['Interior Painting', 'Waterproofing', 'Texture Finish', 'Exterior Painting'], keywords: ['paint', 'wall', 'colour', 'texture'] },
  { name: 'Gardening', icon: 'Sprout', desc: 'Lawn, plants, landscaping', baseCost: 200, color: 'text-teal-600', bg: 'bg-teal-50', subServices: ['Lawn Care', 'Plant Health', 'Landscaping', 'Tree Trimming'], keywords: ['garden', 'plant', 'lawn', 'tree'] },
  { name: 'Driving', icon: 'Car', desc: 'Commute, errands, delivery', baseCost: 150, color: 'text-indigo-600', bg: 'bg-indigo-50', subServices: ['City Commute', 'Errand Driving', 'Goods Transport'], keywords: ['drive', 'driver', 'ride', 'transport'] },
  { name: 'Caregiving', icon: 'Heart', desc: 'Eldercare, childcare, support', baseCost: 350, color: 'text-pink-600', bg: 'bg-pink-50', subServices: ['Eldercare', 'Childcare', 'Post-Operative Care'], keywords: ['care', 'elder', 'child', 'nurse'] },
];

const WORKERS_DATA = [
  { name: 'Rajesh Kumar', phone: '9801000001', skills: ['Pipe Repair', 'Tap Fitting', 'Drainage Cleaning', 'Geyser Installation'], primaryService: 'Plumbing', experience: 7, rating: 4.8, totalRatings: 120, completedJobs: 342, serviceArea: 'Swaroop Nagar, Kanpur', availability: true, availableNow: true, currentWorkload: 62, recentJobs: 38, verificationStatus: 'approved', cooperative: 'Bharat Seva Cooperative', distanceKm: 2.1, avatarColor: 'bg-primary-600', earnings: { today: 850, weekly: 4200, monthly: 18450, total: 145000 }, welfareContribution: 920, coopContribution: 1845, certifications: ['ITI Plumbing Certified', 'Coop Safety Training'] },
  { name: 'Imran Sheikh', phone: '9801000002', skills: ['Pipe Repair', 'Sanitary Fixtures', 'Leak Detection', 'Bathroom Fittings'], primaryService: 'Plumbing', experience: 5, rating: 4.7, totalRatings: 80, completedJobs: 198, serviceArea: 'Civil Lines, Kanpur', availability: true, availableNow: true, currentWorkload: 34, recentJobs: 12, verificationStatus: 'approved', cooperative: 'Bharat Seva Cooperative', distanceKm: 3.4, avatarColor: 'bg-secondary-600', earnings: { today: 0, weekly: 2800, monthly: 14200, total: 89000 }, welfareContribution: 710, coopContribution: 1420, certifications: ['ITI Plumbing', 'Advanced Leak Diagnostics'] },
  { name: 'Sunita Devi', phone: '9801000003', skills: ['Deep Cleaning', 'Kitchen Sanitization', 'Move-in Cleaning', 'Daily Help', 'Cooking Help'], primaryService: 'Cleaning', experience: 6, rating: 4.9, totalRatings: 150, completedJobs: 410, serviceArea: 'Swaroop Nagar, Kanpur', availability: true, availableNow: false, currentWorkload: 70, recentJobs: 44, verificationStatus: 'approved', cooperative: 'Swachh Seva Cooperative', distanceKm: 1.8, avatarColor: 'bg-teal-600', earnings: { today: 1200, weekly: 5500, monthly: 19800, total: 168000 }, welfareContribution: 990, coopContribution: 1980, certifications: ['Hygiene Certified', 'Eco-Friendly Practices'] },
  { name: 'Anil Verma', phone: '9801000004', skills: ['Wiring Repair', 'Switch Replacement', 'Fan Installation', 'Inverter Setup', 'MCB Repair'], primaryService: 'Electrical', experience: 9, rating: 4.8, totalRatings: 110, completedJobs: 288, serviceArea: 'Kakadeo, Kanpur', availability: true, availableNow: true, currentWorkload: 48, recentJobs: 22, verificationStatus: 'approved', cooperative: 'Bharat Seva Cooperative', distanceKm: 2.6, avatarColor: 'bg-accent-600', earnings: { today: 0, weekly: 4800, monthly: 21000, total: 180000 }, welfareContribution: 1050, coopContribution: 2100, certifications: ['Licensed Electrician', 'Electrical Safety Grade A'] },
  { name: 'Mohammed Faisal', phone: '9801000005', skills: ['Wiring Repair', 'MCB Repair', 'Smart Home Setup', 'Switch Replacement'], primaryService: 'Electrical', experience: 4, rating: 4.6, totalRatings: 55, completedJobs: 142, serviceArea: 'Kidwai Nagar, Kanpur', availability: true, availableNow: true, currentWorkload: 22, recentJobs: 8, verificationStatus: 'approved', cooperative: 'Bharat Seva Cooperative', distanceKm: 4.1, avatarColor: 'bg-amber-600', earnings: { today: 500, weekly: 2200, monthly: 11800, total: 65000 }, welfareContribution: 590, coopContribution: 1180, certifications: ['ITI Electrical'] },
  { name: 'Prakash Rao', phone: '9801000006', skills: ['Furniture Repair', 'Door Fitting', 'Modular Work', 'Cabinet Work', 'Shelf Installation'], primaryService: 'Carpentry', experience: 11, rating: 4.9, totalRatings: 130, completedJobs: 356, serviceArea: 'Govind Nagar, Kanpur', availability: true, availableNow: false, currentWorkload: 58, recentJobs: 30, verificationStatus: 'approved', cooperative: 'Kushal Seva Cooperative', distanceKm: 3.0, avatarColor: 'bg-rose-600', earnings: { today: 0, weekly: 5200, monthly: 22500, total: 210000 }, welfareContribution: 1125, coopContribution: 2250, certifications: ['Master Carpenter', 'Furniture Design Cert.'] },
  { name: 'Lakshmi Nair', phone: '9801000007', skills: ['Eldercare', 'Post-Operative Care', 'Childcare', 'Medical Assistance'], primaryService: 'Caregiving', experience: 8, rating: 4.9, totalRatings: 90, completedJobs: 264, serviceArea: 'Civil Lines, Kanpur', availability: true, availableNow: true, currentWorkload: 40, recentJobs: 18, verificationStatus: 'approved', cooperative: 'Seva Care Cooperative', distanceKm: 2.4, avatarColor: 'bg-pink-600', earnings: { today: 700, weekly: 3800, monthly: 17600, total: 132000 }, welfareContribution: 880, coopContribution: 1760, certifications: ['Nursing Assistant', 'First Aid Certified'] },
  { name: 'Deepak Singh', phone: '9801000008', skills: ['City Commute', 'Errand Driving', 'Goods Transport', 'Airport Pickup'], primaryService: 'Driving', experience: 6, rating: 4.7, totalRatings: 200, completedJobs: 512, serviceArea: 'Swaroop Nagar, Kanpur', availability: true, availableNow: true, currentWorkload: 30, recentJobs: 26, verificationStatus: 'approved', cooperative: 'Safar Seva Cooperative', distanceKm: 1.5, avatarColor: 'bg-indigo-600', earnings: { today: 900, weekly: 3500, monthly: 15400, total: 110000 }, welfareContribution: 770, coopContribution: 1540, certifications: ['Commercial License', 'Defensive Driving Cert.'] },
  { name: 'Vikram Patel', phone: '9801000009', skills: ['AC Service', 'Refrigerator Repair', 'Washing Machine Repair', 'General Appliance Repair', 'Device Setup'], primaryService: 'Appliance Repair', experience: 7, rating: 4.8, totalRatings: 95, completedJobs: 234, serviceArea: 'Arya Nagar, Kanpur', availability: true, availableNow: true, currentWorkload: 44, recentJobs: 20, verificationStatus: 'approved', cooperative: 'Tech Seva Cooperative', distanceKm: 3.8, avatarColor: 'bg-slate-700', earnings: { today: 1100, weekly: 4400, monthly: 18900, total: 138000 }, welfareContribution: 945, coopContribution: 1890, certifications: ['Diploma in Electronics', 'Brand Service Partner'] },
  { name: 'Gaurav Mehta', phone: '9801000010', skills: ['Interior Painting', 'Waterproofing', 'Texture Finish', 'Exterior Painting', 'Whitewash'], primaryService: 'Painting', experience: 9, rating: 4.7, totalRatings: 70, completedJobs: 188, serviceArea: 'Shastri Nagar, Kanpur', availability: true, availableNow: false, currentWorkload: 36, recentJobs: 14, verificationStatus: 'approved', cooperative: 'Kushal Seva Cooperative', distanceKm: 4.6, avatarColor: 'bg-emerald-600', earnings: { today: 0, weekly: 3800, monthly: 16700, total: 120000 }, welfareContribution: 835, coopContribution: 1670, certifications: ['Painter ITI', 'Lead-Safe Certified'] },
  { name: 'Priti Kumari', phone: '9801000011', skills: ['Daily Help', 'Cooking Help', 'Utensil Cleaning', 'Deep Cleaning', 'Full-Time Maid'], primaryService: 'Househelp', experience: 5, rating: 4.8, totalRatings: 88, completedJobs: 220, serviceArea: 'Kalyanpur, Kanpur', availability: true, availableNow: true, currentWorkload: 45, recentJobs: 18, verificationStatus: 'approved', cooperative: 'Swachh Seva Cooperative', distanceKm: 2.2, avatarColor: 'bg-fuchsia-600', earnings: { today: 600, weekly: 3000, monthly: 14500, total: 95000 }, welfareContribution: 725, coopContribution: 1450, certifications: ['Hygiene Certified'] },
  { name: 'Ramesh Yadav', phone: '9801000012', skills: ['Lawn Care', 'Plant Health', 'Landscaping', 'Tree Trimming'], primaryService: 'Gardening', experience: 5, rating: 4.6, totalRatings: 60, completedJobs: 176, serviceArea: 'Govind Nagar, Kanpur', availability: true, availableNow: true, currentWorkload: 26, recentJobs: 10, verificationStatus: 'approved', cooperative: 'Hariyali Seva Cooperative', distanceKm: 2.9, avatarColor: 'bg-teal-700', earnings: { today: 400, weekly: 2000, monthly: 12300, total: 72000 }, welfareContribution: 615, coopContribution: 1230, certifications: ['Horticulture Diploma'] },
  { name: 'Arjun Tiwari', phone: '9801000013', skills: ['Wiring Repair', 'Switch Replacement', 'Fan Installation'], primaryService: 'Electrical', experience: 3, rating: 4.4, totalRatings: 30, completedJobs: 88, serviceArea: 'Swaroop Nagar, Kanpur', availability: true, availableNow: true, currentWorkload: 15, recentJobs: 5, verificationStatus: 'pending', cooperative: 'Bharat Seva Cooperative', distanceKm: 3.2, avatarColor: 'bg-accent-700', earnings: { today: 0, weekly: 1500, monthly: 8200, total: 35000 }, welfareContribution: 410, coopContribution: 820, certifications: ['ITI Electrical'] },
  { name: 'Meena Sharma', phone: '9801000014', skills: ['Daily Help', 'Cooking Help', 'Deep Cleaning'], primaryService: 'Househelp', experience: 3, rating: 4.3, totalRatings: 25, completedJobs: 65, serviceArea: 'Civil Lines, Kanpur', availability: true, availableNow: false, currentWorkload: 20, recentJobs: 4, verificationStatus: 'pending', cooperative: 'Swachh Seva Cooperative', distanceKm: 3.5, avatarColor: 'bg-purple-600', earnings: { today: 0, weekly: 900, monthly: 6500, total: 22000 }, welfareContribution: 325, coopContribution: 650, certifications: [] },
];

const CUSTOMERS_DATA = [
  { name: 'Priya Sharma', phone: '9900000001', email: 'priya@demo.com', password: 'demo1234', role: 'customer' },
  { name: 'Amit Gupta', phone: '9900000002', email: 'amit@demo.com', password: 'demo1234', role: 'customer' },
  { name: 'Meera Joshi', phone: '9900000003', email: 'meera@demo.com', password: 'demo1234', role: 'customer' },
];

async function seed() {
  console.log('🌱 Starting seed...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    WorkerProfile.deleteMany({}),
    Service.deleteMany({}),
    Booking.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // Seed services
  const services = await Service.insertMany(SERVICES_DATA);
  console.log(`✅ Seeded ${services.length} services`);

  // Seed admin
  const admin = await User.create({
    name: 'Admin Office', phone: '9000000000', email: 'admin@sahkaar.coop',
    password: 'admin2026', role: 'admin',
  });
  console.log('✅ Seeded admin — phone: 9000000000, email: admin@sahkaar.coop, password: admin2026');

  // Seed customers
  const customers = await Promise.all(
    CUSTOMERS_DATA.map((c) => User.create(c))
  );
  console.log(`✅ Seeded ${customers.length} customers`);
  console.log('   Customer 1 — phone: 9900000001, password: demo1234');
  console.log('   Customer 2 — phone: 9900000002, password: demo1234');

  // Seed workers
  const workerUsers = [];
  const workerProfiles = [];
  for (const w of WORKERS_DATA) {
    const user = await User.create({ name: w.name, phone: w.phone, password: 'worker1234', role: 'worker' });
    workerUsers.push(user);
    const initials = w.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    const profile = await WorkerProfile.create({
      userId: user._id,
      name: w.name, phone: w.phone,
      skills: w.skills, primaryService: w.primaryService,
      experience: w.experience, rating: w.rating,
      totalRatings: w.totalRatings, completedJobs: w.completedJobs,
      serviceArea: w.serviceArea, availability: w.availability,
      availableNow: w.availableNow, currentWorkload: w.currentWorkload,
      recentJobs: w.recentJobs, verificationStatus: w.verificationStatus,
      cooperative: w.cooperative, distanceKm: w.distanceKm,
      avatarColor: w.avatarColor, initials,
      earnings: w.earnings, welfareContribution: w.welfareContribution,
      coopContribution: w.coopContribution, certifications: w.certifications,
      benefits: { healthInsurance: true, accidentCover: true, lifeInsurance: true, welfareContribution: true, savingsFund: true },
    });
    workerProfiles.push(profile);
  }
  console.log(`✅ Seeded ${workerProfiles.length} workers (all password: worker1234)`);

  // Seed realistic bookings
  const priya = customers[0];
  const amit = customers[1];
  const rajesh = workerProfiles[0]; // Plumbing
  const sunita = workerProfiles[2]; // Cleaning
  const anil = workerProfiles[3];   // Electrical
  const priti = workerProfiles[10]; // Househelp

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const bookings = await Booking.insertMany([
    {
      bookingRef: 'SS1018',
      customerId: priya._id, customerName: priya.name,
      workerId: anil._id, workerName: anil.name,
      serviceName: 'Electrical', subService: 'Switch Replacement',
      description: 'Two switches in the kitchen are not working.',
      scheduledDate: 'Yesterday', scheduledTime: '4:30 PM',
      customerLocation: 'Swaroop Nagar, Kanpur',
      status: 'SERVICE_COMPLETED', isEmergency: false,
      basePrice: 250, totalAmount: 250, workerEarnings: 205,
      cooperativeContribution: 25, welfareContribution: 15, damageInsurancePremium: 5,
      paymentStatus: 'paid', paymentMethod: 'UPI', paidAt: yesterday,
      ratingGiven: true, matchingScore: 92, priority: 'Normal',
      completedAt: yesterday,
      timeline: [
        { status: 'REQUESTED', time: yesterday }, { status: 'ACCEPTED', time: yesterday },
        { status: 'ON_THE_WAY', time: yesterday }, { status: 'SERVICE_STARTED', time: yesterday },
        { status: 'SERVICE_COMPLETED', time: yesterday },
      ],
    },
    {
      bookingRef: 'SS1023',
      customerId: priya._id, customerName: priya.name,
      workerId: sunita._id, workerName: sunita.name,
      serviceName: 'Cleaning', subService: 'Deep Cleaning',
      description: 'Full home deep cleaning before a family event.',
      scheduledDate: '3 days ago', scheduledTime: '10:00 AM',
      customerLocation: 'Swaroop Nagar, Kanpur',
      status: 'SERVICE_COMPLETED', isEmergency: false,
      basePrice: 350, totalAmount: 350, workerEarnings: 287,
      cooperativeContribution: 35, welfareContribution: 21, damageInsurancePremium: 7,
      paymentStatus: 'paid', paymentMethod: 'Card', paidAt: threeDaysAgo,
      ratingGiven: true, matchingScore: 88, priority: 'Normal',
      completedAt: threeDaysAgo,
      timeline: [
        { status: 'REQUESTED', time: threeDaysAgo }, { status: 'ACCEPTED', time: threeDaysAgo },
        { status: 'SERVICE_COMPLETED', time: threeDaysAgo },
      ],
    },
    {
      bookingRef: 'SS1041',
      customerId: amit._id, customerName: amit.name,
      workerId: rajesh._id, workerName: rajesh.name,
      serviceName: 'Plumbing', subService: 'Pipe Repair',
      description: 'Kitchen pipe leaking under the sink.',
      scheduledDate: 'Today', scheduledTime: '11:00 AM',
      customerLocation: 'Swaroop Nagar, Kanpur',
      status: 'ON_THE_WAY', isEmergency: false,
      basePrice: 300, totalAmount: 300, workerEarnings: 246,
      cooperativeContribution: 30, welfareContribution: 18, damageInsurancePremium: 6,
      paymentStatus: 'pending', matchingScore: 90, priority: 'Normal',
      timeline: [
        { status: 'REQUESTED', time: now }, { status: 'ACCEPTED', time: now }, { status: 'ON_THE_WAY', time: now },
      ],
    },
    {
      bookingRef: 'SS1055',
      customerId: priya._id, customerName: priya.name,
      workerId: priti._id, workerName: priti.name,
      serviceName: 'Househelp', subService: 'Daily Help',
      description: 'Need daily help for cooking and cleaning for 3 hours.',
      scheduledDate: 'Today', scheduledTime: 'Morning',
      customerLocation: 'Civil Lines, Kanpur',
      status: 'REQUESTED', isEmergency: false,
      basePrice: 300, totalAmount: 300, workerEarnings: 246,
      cooperativeContribution: 30, welfareContribution: 18, damageInsurancePremium: 6,
      paymentStatus: 'pending', matchingScore: 85, priority: 'Normal',
      timeline: [{ status: 'REQUESTED', time: now }],
    },
  ]);
  console.log(`✅ Seeded ${bookings.length} bookings`);

  // Seed notifications for Priya
  await Notification.insertMany([
    { userId: priya._id, type: 'success', title: 'Worker Accepted', message: 'Anil Verma has accepted your electrical repair request.', read: true, bookingId: bookings[0]._id },
    { userId: priya._id, type: 'info', title: 'Booking Completed', message: 'Electrical repair #SS1018 has been completed. Please rate your experience.', read: true, bookingId: bookings[0]._id },
    { userId: priya._id, type: 'coop', title: 'Welfare Fund Update', message: 'Your cooperative welfare fund contribution this month: ₹920.', read: false },
    { userId: priya._id, type: 'booking', title: 'New Request', message: 'Your Househelp request #SS1055 has been sent to Priti Kumari.', read: false, bookingId: bookings[3]._id },
  ]);
  console.log('✅ Seeded notifications');

  console.log('\n🎉 Seed complete!');
  console.log('═══════════════════════════════════════════════');
  console.log('📋 DEMO CREDENTIALS');
  console.log('───────────────────────────────────────────────');
  console.log('👤 Admin:    phone: 9000000000  password: admin2026');
  console.log('             email: admin@sahkaar.coop');
  console.log('👥 Customer: phone: 9900000001  password: demo1234');
  console.log('             (Priya Sharma)');
  console.log('👷 Worker:   phone: 9801000001  password: worker1234');
  console.log('             (Rajesh Kumar — Plumbing, Approved)');
  console.log('═══════════════════════════════════════════════');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
