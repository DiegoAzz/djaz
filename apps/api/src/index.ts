import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { searchRouter } from './routes/search.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { apiLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api/search', searchRouter);
app.use('/api/health', healthRouter);

// Serve Static Frontend if built (Coolify / Production deployment)
const possibleWebPaths = [
  path.join(process.cwd(), 'web-dist'),
  path.join(process.cwd(), 'apps/web/dist'),
  path.join(__dirname, '../../web/dist'),
  path.join(__dirname, '../../../web/dist'),
  path.join(__dirname, '../../apps/web/dist')
];

const webDistPath = possibleWebPaths.find((p) => fs.existsSync(p));

if (webDistPath) {
  console.log(`[MiniDJ] Serving static frontend from: ${webDistPath}`);
  app.use(express.static(webDistPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.includes('assets')) {
        // High-speed browser caching for Vite hashed assets
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
} else {
  // Fallback API root
  app.get('/', (_req, res) => {
    res.send({
      message: 'MiniDJ DJAZ Platform Online',
      version: '1.0.0',
      domain: 'djaz.appzplay.online',
      endpoints: {
        health: '/api/health',
        search: '/api/search?q=:term'
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`[MiniDJ DJAZ] Server running on http://localhost:${PORT}`);
});
