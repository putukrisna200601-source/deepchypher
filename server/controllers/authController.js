const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { logActivity } = require('../models/logModel');
const { generateRecoveryKey } = require('../utils/cryptoHelper');

const SALT_ROUNDS = 10;

// Helper: parse user-agent into simple device label
function parseDevice(ua) {
    if (!ua) return 'Desktop';
    if (/Mobi|Android/i.test(ua)) return 'Mobile';
    if (/Tablet|iPad/i.test(ua)) return 'Tablet';
    return 'Desktop';
}

exports.register = async (req, res) => {
    const { username, email, password, masterKey, recoveryKey } = req.body;

    try {
        const [existing] = await db.execute('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Username atau email sudah digunakan.' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const masterKeyHash = await bcrypt.hash(masterKey, SALT_ROUNDS);
        const recoveryKeyHash = await bcrypt.hash(recoveryKey, SALT_ROUNDS);

        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash, master_key_hash, recovery_key_hash) VALUES (?, ?, ?, ?, ?)',
            [username, email, passwordHash, masterKeyHash, recoveryKeyHash]
        );

        const userId = result.insertId;
        const device = parseDevice(req.headers['user-agent']);
        const ip = req.ip || req.connection.remoteAddress;

        await logActivity(userId, 'REGISTER', 'Account Created', ip, device);

        res.status(201).json({ success: true, message: 'Registrasi berhasil.', recoveryKey });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
};

exports.login = async (req, res) => {
    const { username, password, masterKey } = req.body;

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Kredensial tidak valid.' });
        }

        const user = users[0];
        
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Kredensial tidak valid.' });
        }

        const isMasterKeyValid = await bcrypt.compare(masterKey, user.master_key_hash);
        if (!isMasterKeyValid) {
            return res.status(401).json({ success: false, message: 'Master key tidak valid.' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });

        const device = parseDevice(req.headers['user-agent']);
        const ip = req.ip || req.connection.remoteAddress;
        await logActivity(user.id, 'LOGIN', 'Account Login', ip, device);

        res.status(200).json({ success: true, message: 'Login berhasil.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
};

exports.logout = async (req, res) => {
    if (req.user) {
        const device = parseDevice(req.headers['user-agent']);
        const ip = req.ip || req.connection.remoteAddress;
        await logActivity(req.user.id, 'LOGOUT', 'Account Logout', ip, device);
    }
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logout berhasil.' });
};

exports.recovery = async (req, res) => {
    const { email, recoveryKey, newPassword, newMasterKey } = req.body;

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Email atau recovery key tidak valid.' });
        }

        const user = users[0];
        const isRecoveryKeyValid = await bcrypt.compare(recoveryKey, user.recovery_key_hash);
        
        if (!isRecoveryKeyValid) {
            return res.status(401).json({ success: false, message: 'Email atau recovery key tidak valid.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        const newMasterKeyHash = await bcrypt.hash(newMasterKey, SALT_ROUNDS);
        const newGeneratedRecoveryKey = generateRecoveryKey();
        const newRecoveryKeyHash = await bcrypt.hash(newGeneratedRecoveryKey, SALT_ROUNDS);

        await db.execute(
            'UPDATE users SET password_hash = ?, master_key_hash = ?, recovery_key_hash = ? WHERE id = ?',
            [newPasswordHash, newMasterKeyHash, newRecoveryKeyHash, user.id]
        );

        const device = parseDevice(req.headers['user-agent']);
        const ip = req.ip || req.connection.remoteAddress;
        await logActivity(user.id, 'RECOVERY', 'Account Recovered', ip, device);

        res.status(200).json({ success: true, message: 'Pemulihan akun berhasil.', recoveryKey: newGeneratedRecoveryKey });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
};

exports.profile = async (req, res) => {
    res.status(200).json({ success: true, user: req.user });
};
