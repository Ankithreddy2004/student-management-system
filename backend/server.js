const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const db = require('./config/db');

// Import routes
const studentRoutes = require('./routes/studentRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const marksRoutes = require('./routes/marksRoutes');

const app = express();

// Disable API response caching
app.set('etag', false);

app.use((req, res, next) => {
    res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Test API
app.get('/', (req, res) => {
    res.send('Student Management API is Running!');
});

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});