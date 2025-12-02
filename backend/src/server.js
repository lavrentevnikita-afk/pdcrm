require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Basic middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Healthcheck route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'pdcrm-backend',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unknown API routes
app.use('/api', (req, res, next) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`PDCRM backend listening on port ${PORT}`);
});
