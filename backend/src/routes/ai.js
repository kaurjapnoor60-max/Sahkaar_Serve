const router = require('express').Router();
const { parseRequest } = require('../controllers/aiController');

router.post('/parse-request', parseRequest);

module.exports = router;
