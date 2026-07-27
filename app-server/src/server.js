const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api', apiRoutes);

// Test Database Connection on startup
db.query('SELECT NOW()')
  .then((res) => {
    console.log('PostgreSQL connected successfully at:', res.rows[0].now);
  })
  .catch((err) => {
    console.error('PostgreSQL Connection Error:', err.message);
  });

// Prevent crash on uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});