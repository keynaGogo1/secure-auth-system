const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

// ✅ NEW: Import your auth route
const authRoutes = require('./routes/auth');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ NEW: Use the route
app.use('/auth', authRoutes);

// Database
require('./db');

// Start server
app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
