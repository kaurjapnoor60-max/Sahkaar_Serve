const WorkerProfile = require('../models/WorkerProfile');
const Booking = require('../models/Booking');

async function getWorkers(req, res, next) {
  try {
    const { service, available } = req.query;
    const filter = { verificationStatus: 'approved' };
    if (available === 'true') filter.availability = true;
    if (service) {
      filter.$or = [
        { primaryService: { $regex: service, $options: 'i' } },
        { skills: { $elemMatch: { $regex: service, $options: 'i' } } },
      ];
    }
    const workers = await WorkerProfile.find(filter).sort({ rating: -1 }).lean();
    res.json({ success: true, data: { workers } });
  } catch (err) { next(err); }
}

async function getWorkerById(req, res, next) {
  try {
    const worker = await WorkerProfile.findById(req.params.id).lean();
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });
    res.json({ success: true, data: { worker } });
  } catch (err) { next(err); }
}

async function getMyProfile(req, res, next) {
  try {
    const worker = await WorkerProfile.findOne({ userId: req.user.userId }).lean();
    if (!worker) return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    res.json({ success: true, data: { worker } });
  } catch (err) { next(err); }
}

async function updateMyProfile(req, res, next) {
  try {
    const allowed = ['skills', 'primaryService', 'experience', 'serviceArea', 'baseRate', 'certifications'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const worker = await WorkerProfile.findOneAndUpdate(
      { userId: req.user.userId }, updates, { new: true }
    );
    if (!worker) return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    res.json({ success: true, data: { worker } });
  } catch (err) { next(err); }
}

async function getMyJobs(req, res, next) {
  try {
    const worker = await WorkerProfile.findOne({ userId: req.user.userId });
    if (!worker) return res.json({ success: true, data: { bookings: [] } });
    const bookings = await Booking.find({ workerId: worker._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: { bookings } });
  } catch (err) { next(err); }
}

async function getMyEarnings(req, res, next) {
  try {
    const worker = await WorkerProfile.findOne({ userId: req.user.userId });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker profile not found.' });

    const completed = await Booking.find({ workerId: worker._id, status: 'SERVICE_COMPLETED' }).lean();
    const totalEarnings = completed.reduce((s, b) => s + (b.workerEarnings || 0), 0);
    const avgPerJob = completed.length ? Math.round(totalEarnings / completed.length) : 0;

    // Today / weekly / monthly from DB
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayBookings = completed.filter((b) => new Date(b.updatedAt) >= todayStart);
    const weekBookings = completed.filter((b) => new Date(b.updatedAt) >= weekStart);
    const monthBookings = completed.filter((b) => new Date(b.updatedAt) >= monthStart);

    res.json({
      success: true,
      data: {
        earnings: {
          today: todayBookings.reduce((s, b) => s + (b.workerEarnings || 0), 0),
          weekly: weekBookings.reduce((s, b) => s + (b.workerEarnings || 0), 0),
          monthly: monthBookings.reduce((s, b) => s + (b.workerEarnings || 0), 0) || worker.earnings?.monthly || 0,
          total: totalEarnings || worker.earnings?.total || 0,
          avgPerJob,
          completedJobs: completed.length || worker.completedJobs || 0,
          welfareContribution: worker.welfareContribution || 0,
          coopContribution: worker.coopContribution || 0,
        },
      },
    });
  } catch (err) { next(err); }
}

async function getMonthlyEarnings(req, res, next) {
  try {
    const worker = await WorkerProfile.findOne({ userId: req.user.userId });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker profile not found.' });

    // Aggregate from completed bookings by month
    const agg = await Booking.aggregate([
      { $match: { workerId: worker._id, status: 'SERVICE_COMPLETED' } },
      {
        $group: {
          _id: { year: { $year: '$updatedAt' }, month: { $month: '$updatedAt' } },
          amount: { $sum: '$workerEarnings' },
          jobs: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = agg.map((r) => ({
      month: months[r._id.month - 1],
      year: r._id.year,
      amount: r.amount,
      jobs: r.jobs,
    }));

    // If no data, return seed data for demonstration
    if (!monthly.length) {
      const seedMonthly = [
        { month: 'Mar', year: 2026, amount: 14200, jobs: 42 },
        { month: 'Apr', year: 2026, amount: 15800, jobs: 47 },
        { month: 'May', year: 2026, amount: 13900, jobs: 41 },
        { month: 'Jun', year: 2026, amount: 17200, jobs: 51 },
        { month: 'Jul', year: 2026, amount: 16400, jobs: 49 },
        { month: 'Aug', year: 2026, amount: worker.earnings?.monthly || 18450, jobs: worker.completedJobs || 55 },
      ];
      return res.json({ success: true, data: { monthly: seedMonthly } });
    }

    res.json({ success: true, data: { monthly } });
  } catch (err) { next(err); }
}

async function updateAvailability(req, res, next) {
  try {
    const { availability, availableNow } = req.body;
    const worker = await WorkerProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { availability, availableNow },
      { new: true }
    );
    if (!worker) return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    res.json({ success: true, data: { worker } });
  } catch (err) { next(err); }
}

module.exports = { getWorkers, getWorkerById, getMyProfile, updateMyProfile, getMyJobs, getMyEarnings, getMonthlyEarnings, updateAvailability };
