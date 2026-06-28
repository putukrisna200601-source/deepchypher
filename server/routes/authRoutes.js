const express = require('express');
const router = express.router ? express.router() : express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);
router.post('/recovery', authController.recovery);
router.get('/profile', requireAuth, authController.profile);

module.exports = router;
