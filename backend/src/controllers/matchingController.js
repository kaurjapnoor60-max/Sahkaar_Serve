const { recommendWorkers } = require('../services/matchingService');

async function recommend(req, res, next) {
  try {
    const { serviceName, subService, isEmergency } = req.body;
    if (!serviceName) return res.status(400).json({ success: false, message: 'serviceName is required.' });
    const matches = await recommendWorkers({ serviceName, subService, isEmergency: !!isEmergency });
    res.json({ success: true, data: { matches } });
  } catch (err) { next(err); }
}

module.exports = { recommend };
