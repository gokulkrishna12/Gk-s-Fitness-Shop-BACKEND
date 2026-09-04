const express = require('express');
const router = express.Router();
const { getSmartRecommendation } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// The route is protected, so only logged-in users get AI recommendations
router.post('/recommend', protect, getSmartRecommendation);

module.exports = router;