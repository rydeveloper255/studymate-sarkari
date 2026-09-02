/**
 * StudyMate Sarkari — Input Validation & Sanitization Helpers
 * Protects against SQLi patterns, XSS injection payloads, and parameter pollution.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Strips dangerous HTML tags and control characters
 */
export function sanitizeStringInput(val: unknown, maxLength = 255): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>?/gm, '') // Strip HTML
    .replace(/[^\w\s\-\.,_@#\(\)\/:]/gi, '') // Strip suspicious script symbols
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates integer parameter within min/max range
 */
export function sanitizeInteger(val: unknown, defaultVal = 1, min = 1, max = 100): number {
  if (typeof val === 'string' || typeof val === 'number') {
    const parsed = parseInt(String(val), 10);
    if (!isNaN(parsed)) {
      return Math.min(Math.max(parsed, min), max);
    }
  }
  return defaultVal;
}

/**
 * Validates and sanitizes email address
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 150;
}

/**
 * Express middleware to validate contact form submissions
 */
export function validateContactForm(req: Request, res: Response, next: NextFunction): void {
  const { name, email, subject, message, honeypot } = req.body || {};

  // Honeypot spam check (bots populate hidden fields)
  if (honeypot) {
    res.status(400).json({ error: 'Spam detected' });
    return;
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'Validation Error', message: 'Name is required (at least 2 characters).' });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Validation Error', message: 'A valid email address is required.' });
    return;
  }

  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    res.status(400).json({ error: 'Validation Error', message: 'Message must be at least 10 characters long.' });
    return;
  }

  // Attach sanitized data to request
  req.body.name = sanitizeStringInput(name, 100);
  req.body.email = email.trim().toLowerCase();
  req.body.subject = sanitizeStringInput(subject || 'General Inquiry', 100);
  req.body.message = sanitizeStringInput(message, 2000);

  next();
}
