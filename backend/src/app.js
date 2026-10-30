import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { handleRedirect } from './controllers/referralController.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import campaignRoutes from './routes/campaigns.js';
import adviewRoutes from './routes/adviews.js';
import activityRoutes from './routes/activities.js';
import referralRoutes from './routes/referrals.js';
import dealRoutes from './routes/deals.js';
import walletRoutes from './routes/wallet.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers with cross-origin resource policy allowed for streaming videos
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Serve static local videos
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));

// CORS configuration supporting configured origins and local dev ports
const allowedOrigins = env.CLIENT_ORIGINS;
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from origin ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logger
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global API rate limiter
app.use('/api', apiLimiter);

// Public root redirect for referral codes (/r/:code and /api/r/:code)
app.get('/r/:code', handleRedirect);
app.get('/api/r/:code', handleRedirect);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/adviews', adviewRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
