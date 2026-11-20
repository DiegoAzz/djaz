import { Router, Request, Response } from 'express';
import { youtubeService } from '../services/youtube.service.js';

export const searchRouter = Router();

searchRouter.get('/', async (req: Request, res: Response) => {
  const q = req.query.q;
  const pageToken = req.query.pageToken as string | undefined;

  if (!q || typeof q !== 'string') {
    res.status(400).json({
      error: 'El parámetro "q" es obligatorio.',
      status: 400
    });
    return;
  }

  const query = q.trim();
  if (query.length < 2) {
    res.status(400).json({
      error: 'El término de búsqueda debe tener al menos 2 caracteres.',
      status: 400
    });
    return;
  }

  if (query.length > 100) {
    res.status(400).json({
      error: 'El término de búsqueda no puede superar los 100 caracteres.',
      status: 400
    });
    return;
  }

  try {
    const results = await youtubeService.search(query, pageToken);
    res.json(results);
  } catch (err: any) {
    console.error('[Search Route Error]', err);
    res.status(500).json({
      error: 'Error interno al procesar la búsqueda.',
      details: err?.message || 'Error desconocido'
    });
  }
});
