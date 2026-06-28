const db = require('../config/db');

exports.getHistory = async (req, res) => {
    try {
        const [history] = await db.execute(
            'SELECT filename, operation, status, created_at, expired_at FROM stego_history WHERE user_id = ? AND (expired_at > NOW() OR expired_at IS NULL) ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json({ success: true, data: history });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal mengambil riwayat steganografi.' });
    }
};
