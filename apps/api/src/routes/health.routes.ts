import { Router, Request, Response } from 'express';
import { youtubeService } from '../services/youtube.service.js';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'minidj-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    youtubeKeyConfigured: youtubeService.isKeyConfigured(),
    environment: process.env.NODE_ENV || 'development'
  });
});
