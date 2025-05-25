const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// In-memory OTP storage
const otpStore = {};

// ✅ CAPTCHA endpoint
router.get('/captcha', (req, res) => {
  const a = Math.floor(Math.random() * 10);
  const b = Math.floor(Math.random() * 10);
  res.json({
    question: `What is ${a} + ${b}?`,
    answer: a + b
  });
});

// ✅ Registration endpoint
router.post('/register', async (req, res) => {
  const { username, password, phone } = req.body;

  if (!username || !password || !phone) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const [existing] = await db.promise().query(
      'SELECT * FROM users WHERE username = ? OR phone = ?',
      [username, phone]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username or phone already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query(
      'INSERT INTO users (username, password, phone) VALUES (?, ?, ?)',
      [username, hashedPassword, phone]
    );

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[phone] = otp;

    res.status(200).json({ 
      message: '✅ Registered successfully! OTP has been sent.', 
      otp 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ✅ OTP Verification
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  if (otpStore[phone] && otpStore[phone].toString() === otp.toString()) {
    delete otpStore[phone];
    return res.status(200).json({ message: '✅ OTP verified successfully!' });
  } else {
    return res.status(400).json({ message: '❌ Incorrect OTP. Try again.' });
  }
});

module.exports = router;
