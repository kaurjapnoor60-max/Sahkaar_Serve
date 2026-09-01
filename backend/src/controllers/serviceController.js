const Service = require('../models/Service');

async function getServices(req, res, next) {
  try {
    const services = await Service.find({ active: true }).sort({ name: 1 }).lean();
    res.json({ success: true, data: { services } });
  } catch (err) { next(err); }
}

async function getServiceById(req, res, next) {
  try {
    const service = await Service.findById(req.params.id).lean();
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
    res.json({ success: true, data: { service } });
  } catch (err) { next(err); }
}

module.exports = { getServices, getServiceById };
