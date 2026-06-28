const app = require('./app');
const http = require('http');
const initDB = require('./config/initDb');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize database tables, then start server
initDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Visit http://localhost:${PORT}/ to view the application.`);
        }
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    // Start server anyway
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (DB init failed)`);
    });
});
