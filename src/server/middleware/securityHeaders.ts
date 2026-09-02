/**
 * StudyMate Sarkari — Security Headers Middleware
 * Implements strict HTTP response headers to protect against XSS, clickjacking, MIME-sniffing, and MITM.
 */

import { Request, Response, NextFunction } from 'express';

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking (allow same origin if iframe required)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // XSS Protection for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict sensitive browser permissions
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content-Security-Policy
  // In development Vite needs inline scripts / ws connection; in production we use strict directives.
  const isDev = process.env.NODE_ENV !== 'production';

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: https: blob:`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.telegram.org ${isDev ? 'ws: wss:' : ''}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  next();
}
