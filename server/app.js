const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
// app.use(helmet({...})); // Temporarily disabled to prevent CSP from blocking external scripts
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static frontend files from 'client' directory
app.use(express.static(path.join(__dirname, '../client'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Routes
const authRoutes = require('./routes/authRoutes');
const activityRoutes = require('./routes/activityRoutes');
const historyRoutes = require('./routes/historyRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/history', historyRoutes);

// Fallback for all other routes to serve index.html (SPA-like behavior, optional)
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../client/index.html'));
    } else {
        next();
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;
