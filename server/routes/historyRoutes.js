const express = require('express');
const router = express.router ? express.router() : express.Router();
const historyController = require('../controllers/historyController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, historyController.getHistory);

module.exports = router;
