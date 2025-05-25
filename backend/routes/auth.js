// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

// Rate limiter: 5 login attempts per IP every 10 minutes
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: '🚫 Too many login attempts. Please try again later.',
});

// ➕ Register
router.post('/register', async (req, res) => {
  const { username, password, phone } = req.body;

  if (!username || !password || !phone) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    'INSERT INTO users (username, password_hash, phone) VALUES (?, ?, ?)',
    [username, hashedPassword, phone],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'User already exists or DB error' });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      db.query(
        'INSERT INTO phone_otps (phone, otp_code, expires_at) VALUES (?, ?, ?)',
        [phone, otp, expiresAt],
        (err2) => {
          if (err2) {
            return res.status(500).json({ message: 'Error saving OTP' });
          }

          console.log(`📱 OTP for ${phone}: ${otp}`); // Simulated SMS
          res.json({ message: 'Registered. OTP sent to phone (console).' });
        }
      );
    }
  );
});

// 🔐 Login
router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your phone number first' });
    }

    res.json({ message: 'Login successful!' });
  });
});

// ✅ Verify OTP
router.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;

  db.query(
    'SELECT * FROM phone_otps WHERE phone = ? ORDER BY id DESC LIMIT 1',
    [phone],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(400).json({ message: 'OTP not found' });
      }

      const otpRecord = results[0];

      if (otpRecord.otp_code !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      if (new Date(otpRecord.expires_at) < new Date()) {
        return res.status(400).json({ message: 'OTP expired' });
      }

      // Mark user as verified
      db.query('UPDATE users SET is_verified = 1 WHERE phone = ?', [phone], (err2) => {
        if (err2) {
          return res.status(500).json({ message: 'Error updating user' });
        }
        res.json({ message: 'Phone verified successfully!' });
      });
    }
  );
});

// ➕ Math CAPTCHA endpoint
router.get('/captcha', (req, res) => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  res.json({
    question: `What is ${a} + ${b}?`,
    answer: a + b,
  });
});

module.exports = router;
