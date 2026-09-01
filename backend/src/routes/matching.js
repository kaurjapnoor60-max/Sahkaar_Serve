const router = require('express').Router();
const { recommend } = require('../controllers/matchingController');
const { requireAuth } = require('../middleware/auth');

router.post('/recommend', requireAuth, recommend);

module.exports = router;
