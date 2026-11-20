import rateLimit from 'express-rate-limit';

// Generous rate limit (300 requests per 15 minutes in dev / 120 per minute) to never block user searches
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiter on localhost / local development
    const ip = req.ip || req.socket.remoteAddress;
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  },
  message: {
    error: 'Demasiadas solicitudes de búsqueda. Por favor espera unos segundos.',
    status: 429
  }
});
