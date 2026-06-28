const db = require('../config/db');

exports.getActivity = async (req, res) => {
    try {
        const [logs] = await db.execute(
            'SELECT activity_type, description, created_at, ip_address, device FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json({ success: true, data: logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal mengambil riwayat aktivitas.' });
    }
};

exports.logActivity = async (req, res) => {
    try {
        const { type, status, file, statusDet, device } = req.body;
        const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        let activityType = 'LOGIN';
        if (type === 'Encryption') activityType = 'ENCRYPT';
        if (type === 'Decryption') activityType = 'DECRYPT';

        // 1. Insert into activity_logs
        await db.execute(
            'INSERT INTO activity_logs (user_id, activity_type, description, ip_address, device) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, activityType, statusDet || status || type, ip, device || 'Desktop']
        );

        // 2. Insert into stego_history if Encryption/Decryption
        if (activityType === 'ENCRYPT' || activityType === 'DECRYPT') {
            let mappedStatus = 'SUCCESS';
            if (status === 'Failed') mappedStatus = 'FAILED';

            let expiredAt = null;
            if (activityType === 'ENCRYPT' && mappedStatus === 'SUCCESS') {
                expiredAt = new Date();
                expiredAt.setHours(expiredAt.getHours() + 24); // 24 hours history
            }

            await db.execute(
                'INSERT INTO stego_history (user_id, filename, operation, status, expired_at) VALUES (?, ?, ?, ?, ?)',
                [req.user.id, file || 'unknown.png', activityType, mappedStatus, expiredAt]
            );
        }

        res.status(200).json({ success: true, message: 'Log saved' });
    } catch (err) {
        console.error('Failed to save log:', err);
        res.status(500).json({ success: false, message: 'Failed to save log' });
    }
};
