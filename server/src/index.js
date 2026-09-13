const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const { startCleanupJob } = require('./services/cleanupService');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (e.g. localhost:5173) and production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers (allow large JSON payload for huge texts/prompts)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DropThing Backend API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRoutes);

// Start background 24-hour expiration cleaner
startCleanupJob();

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 DropThing Server running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log(`=========================================`);
});
