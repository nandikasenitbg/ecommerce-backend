/**
 * ============================================================
 *  E-COMMERCE BACKEND - Main Server Entry Point
 *  Author  : Your Name
 *  Version : 1.0.0
 * ============================================================
 */

require('dotenv').config();
require('colors');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// ─── Route Imports ────────────────────────────────────────────────────────────
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── CORS Configuration ───────────────────────────────────────────────────────
// Allows requests from your React/Vite frontend
const corsOptions = {
  origin: [
    process.env.CLIENT_URL,
    'https://aura-mart-pro.vercel.app',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
// NOTE: Stripe webhook needs raw body — must come BEFORE express.json()
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Request Logger ──────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static Files (for uploaded images) ──────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check & Root ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('E-Commerce API is running...');
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-Commerce API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// ─── Error Handling Middleware (must be last) ─────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n================================================'.cyan);
  console.log(
    `  Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  );
  console.log(`  API URL: http://localhost:${PORT}/api`.green);
  console.log(`  Health:  http://localhost:${PORT}/api/health`.green);
  console.log('================================================\n'.cyan);
});

// ─── Graceful Shutdown on Unhandled Errors ────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`.red.bold);
  // Close server gracefully before exiting
  server.close(() => {
    console.log('Server closed due to unhandled rejection.'.red);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...'.yellow);
  server.close(() => {
    console.log('Server closed.'.green);
    process.exit(0);
  });
});

module.exports = app;
