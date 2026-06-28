const mysql = require('mysql2/promise');
require('dotenv').config();

let poolConfig = {};

if (process.env.MYSQL_URL) {
    // Railway MySQL URL
    const url = new URL(process.env.MYSQL_URL);
    poolConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1) || process.env.DB_NAME || 'deepchypher_db',
    };
} else {
    poolConfig = {
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'deepchypher_db',
    };
}

const pool = mysql.createPool({
    ...poolConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
