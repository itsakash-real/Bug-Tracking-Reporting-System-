require('dotenv').config();

// Force MOCK_DB mode to true for CV/Portfolio deployment unconditionally
process.env.MOCK_DB = 'true';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { seedIfEmpty } = require('./utils/seeder');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bugRoutes = require('./routes/bugRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB, then auto-seed if empty (skip if MOCK_DB is enabled)
if (process.env.MOCK_DB?.trim() === 'true') {
  console.log('⚡ MOCK_DB is enabled! Skipping MongoDB connection.');
} else {
  connectDB().then(() => {
    seedIfEmpty().catch(err => console.error('Auto-seed error:', err));
  });
}

// ------- Middleware -------
app.use(helmet());

// Build dynamic origins list — supports local dev + deployed frontend
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ------- Routes -------
if (process.env.MOCK_DB?.trim() === 'true') {
  const mockDbMiddleware = require('./middleware/mockDbMiddleware');
  app.use('/api', mockDbMiddleware);
} else {
  app.use('/api/auth', authRoutes);
  app.use('/api/bugs', bugRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/ai', aiRoutes);
}

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bug Tracker API is running 🚀',
    timestamp: new Date().toISOString(),
  });
});

// ------- 404 Handler -------
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ------- Global Error Handler -------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ------- Start Server (only when running directly, not on Vercel) -------
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Bug Tracker API running at http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
  });
}

module.exports = app;
