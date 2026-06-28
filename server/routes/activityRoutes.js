const express = require('express');
const router = express.router ? express.router() : express.Router();
const activityController = require('../controllers/activityController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, activityController.getActivity);
router.post('/log', requireAuth, activityController.logActivity);

module.exports = router;
