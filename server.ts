import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import apiRouter from './server/routes/api.ts';
import { connectDatabase, isMongoConnected } from './server/config/database.ts';
import { seedDatabase } from './server/seed/seedData.ts';
import { initCronJobs } from './server/jobs/cronJobs.ts';
import { initEmailService } from './server/services/emailService.ts';
import { errorHandler } from './server/middleware/error.ts';
import { uploadDir } from './server/middleware/upload.ts';
import { UserModel } from './server/models/index.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// -----------------------------------------------------------------------------
// Validate required production environment variables
// -----------------------------------------------------------------------------
if (!isDev) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'trainsure-super-secure-jwt-secret-key-2026' || jwtSecret.length < 16) {
    console.error('[TrainSure] FATAL: JWT_SECRET must be set to a strong unique secret (at least 16 characters) in production.');
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error('[TrainSure] FATAL: MONGO_URI must be configured in production for MongoDB Atlas connectivity.');
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// CORS Configuration
// -----------------------------------------------------------------------------
const allowedOrigins: string[] = [];

// Parse CLIENT_URL (supports comma-separated list of origins)
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach(origin => {
    const trimmed = origin.trim().replace(/\/+$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

// Parse ALLOWED_ORIGINS if set
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
    const trimmed = origin.trim().replace(/\/+$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

// In local development, add localhost origins
if (isDev) {
  ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'].forEach(o => {
    if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile clients, curl, server-to-server, Render health checks)
      if (!origin) return callback(null, true);

      // Check configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check Vercel preview domains if enabled
      if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && /^https:\/\/[\w-]+-[\w-]+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // In local development, be permissive
      if (isDev) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400,
  })
);

// -----------------------------------------------------------------------------
// Request Body Parsing & Uploads Static Serving
// -----------------------------------------------------------------------------
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure upload folder exists and serve static uploaded files
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    // ignore
  }
}
app.use('/uploads', express.static(uploadDir));

// -----------------------------------------------------------------------------
// Root & Informational Routes
// -----------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'TrainSure Enterprise Management API',
    status: 'ONLINE',
    version: '1.0.0',
    healthCheck: '/api/health',
    frontend: process.env.CLIENT_URL || undefined,
  });
});

// Mount REST API Router
app.use('/api', apiRouter);

// Catch unmatched /api routes with clean JSON 404
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    error: 'NOT_FOUND',
  });
});

// Centralized API Error Handling Middleware
app.use(errorHandler);

// -----------------------------------------------------------------------------
// Server Lifecycle & Startup
// -----------------------------------------------------------------------------
async function startServer() {
  try {
    // 1. Initialize Database
    await connectDatabase();

    // 2. Ensure initial workforce dataset is seeded
    const adminUser = await UserModel.findOne({ email: 'admin@trainsure.internal' });
    const userCount = await UserModel.countDocuments();
    if ((userCount === 0 || !adminUser) && process.env.SEED_DEMO_DATA !== 'false') {
      console.log('[TrainSure Seed] Empty database or missing admin detected on startup: seeding workforce dataset...');
      await seedDatabase(userCount === 0);
    } else if (process.env.SEED_DEMO_DATA === 'true') {
      console.log('[TrainSure Seed] SEED_DEMO_DATA=true: forcing full database re-seed...');
      await seedDatabase(true);
    } else {
      console.log(`[TrainSure Seed] Database contains ${userCount} existing users including verified admin. Skipping auto-seed.`);
    }

    // 3. Initialize background scheduled jobs
    initCronJobs();

    // 4. Initialize optional email service
    initEmailService();

    // 5. Mount Vite middleware in development
    if (isDev) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[TrainSure] Vite development middleware mounted.');
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`  TrainSure Backend Web Service Active on port ${PORT}`);
      console.log(`  Environment: ${isDev ? 'development' : 'production'}`);
      console.log(`  Database: ${isMongoConnected ? 'MongoDB Atlas' : 'Embedded file-based DB'}`);
      console.log(`  API Health: http://localhost:${PORT}/api/health`);
      if (allowedOrigins.length > 0) {
        console.log(`  Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
      }
      console.log(`====================================================`);
    });

    // Graceful Shutdown handlers
    const gracefulShutdown = (signal: string) => {
      console.log(`[TrainSure Server] ${signal} signal received: shutting down gracefully...`);
      server.close(() => {
        console.log('[TrainSure Server] HTTP server closed.');
        if (isMongoConnected) {
          mongoose.connection.close(false).then(() => {
            console.log('[TrainSure Server] MongoDB connection closed.');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (err) {
    console.error('[TrainSure Server Startup Error]:', err);
    process.exit(1);
  }
}

export { app, startServer };

// Auto-start only when executed directly as main script
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.js')
);

if (isMainModule && process.env.NODE_ENV !== 'test') {
  startServer();
}
