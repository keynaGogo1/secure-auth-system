
const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();


const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'secure_auth'
});


db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
  } else {
    console.log('✅ Connected to MySQL database.');
  }
});

module.exports = db;
