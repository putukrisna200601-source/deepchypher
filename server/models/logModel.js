const db = require('../config/db');

const logActivity = async (userId, type, description, ipAddress, device) => {
    try {
        await db.execute(
            'INSERT INTO activity_logs (user_id, activity_type, description, ip_address, device) VALUES (?, ?, ?, ?, ?)',
            [userId, type, description, ipAddress, device]
        );
    } catch (err) {
        console.error('Failed to log activity:', err);
    }
};

module.exports = { logActivity };
