import type { RequestHandler } from 'express';
import { HttpError } from '../errors.js';

// Requiring a JSON content type on writes forces browsers to send a CORS preflight,
// so pages on other origins cannot submit cookie-authenticated forms to the API.
export const requireJson: RequestHandler = (req, _res, next) => {
  if ((req.method === 'POST' || req.method === 'PATCH') && !req.is('application/json')) {
    throw new HttpError(415, 'unsupported_media_type', 'Content-Type must be application/json');
  }
  next();
};
