require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { getPool, closePool } = require('./config/db');
const { notFound, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

// ============ MIDDLEWARE ============
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Placement Management API is running',
    timestamp: new Date().toISOString(),
  });
});

// ============ ROUTES ============
// We'll add these in Stage 2 onwards
   app.use('/api/auth', require('./routes/authRoutes'));
   app.use('/api/students', require('./routes/studentRoutes'));
   app.use('/api/companies', require('./routes/companyRoutes')); 
   app.use('/api/jobs', require('./routes/jobRoutes')); 
   app.use('/api/applications', require('./routes/applicationRoutes'));
   app.use('/api/interviews', require('./routes/interviewRoutes')); 
   app.use('/api/placements', require('./routes/placementRoutes'));
   app.use('/api/reports', require('./routes/reportRoutes')); 
   app.use('/api/notifications', require('./routes/notificationRoutes'));
// ...

// ============ ERROR HANDLING ============
app.use(notFound);
app.use(globalErrorHandler);

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await getPool(); // test DB connection before listening
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await closePool();
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();