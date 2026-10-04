import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRouter from './server/routes/api.ts';
import { connectDatabase } from './server/config/database.ts';
import { seedDatabase } from './server/seed/seedData.ts';
import { initCronJobs } from './server/jobs/cronJobs.ts';
import { initEmailService } from './server/services/emailService.ts';
import { errorHandler } from './server/middleware/error.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// CORS & Parsers
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure uploads folder exists and serve static uploaded files
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Mount REST API Router
app.use('/api', apiRouter);

// Centralized API Error Handling Middleware
app.use(errorHandler);

async function startServer() {
  try {
    // 1. Initialize Database
    await connectDatabase();

    // 2. Seed initial demo workforce dataset
    await seedDatabase(false);

    // 3. Initialize background scheduled jobs
    initCronJobs();

    // 4. Initialize optional email service
    initEmailService();

    // 5. Mount Vite middleware for dev or static frontend for prod
    if (isDev) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[TrainSure] Vite development middleware mounted.');
    } else {
      const distPath = path.resolve(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`  TrainSure Full-Stack Platform Active on port ${PORT}`);
      console.log(`  API Health: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[TrainSure Server Startup Error]:', err);
    process.exit(1);
  }
}

startServer();
