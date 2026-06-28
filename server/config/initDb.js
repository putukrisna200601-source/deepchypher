const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
    try {
        // Railway provides MYSQL_URL or individual vars (MYSQLHOST, MYSQLUSER, etc.)
        const connConfig = {};
        
        if (process.env.MYSQL_URL) {
            // Railway MySQL URL format
            const url = new URL(process.env.MYSQL_URL);
            connConfig.host = url.hostname;
            connConfig.port = parseInt(url.port) || 3306;
            connConfig.user = url.username;
            connConfig.password = url.password;
        } else {
            connConfig.host = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
            connConfig.port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306');
            connConfig.user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
            connConfig.password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
        }

        const connection = await mysql.createConnection(connConfig);

        const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'deepchypher_db';
        
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`Database '${dbName}' ensured.`);

        await connection.query(`USE \`${dbName}\``);

        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                master_key_hash VARCHAR(255) NOT NULL,
                recovery_key_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Table users created/ensured.');

        // Create activity_logs table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                activity_type ENUM('LOGIN', 'LOGOUT', 'REGISTER', 'RECOVERY', 'PASSWORD_CHANGED', 'MASTERKEY_CHANGED', 'ENCRYPT', 'DECRYPT') NOT NULL,
                description VARCHAR(255),
                ip_address VARCHAR(45),
                device VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Table activity_logs created/ensured.');

        // Create stego_history table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS stego_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                filename VARCHAR(255) NOT NULL,
                operation ENUM('ENCRYPT', 'DECRYPT') NOT NULL,
                status ENUM('SUCCESS', 'FAILED') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expired_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Table stego_history created/ensured.');

        await connection.end();
        console.log('Database initialization completed.');
    } catch (err) {
        console.error('Database initialization failed:', err.message);
        console.error('Make sure your MySQL server is running!');
    }
}

module.exports = initDB;
