import { setTimeout as sleep } from 'node:timers/promises';
import type { RequestHandler } from 'express';
import { MAX_DELAY_MS } from '../config.js';
import { HttpError } from '../errors.js';

// GET-only helpers for building loading and error states. Not mounted when NODE_ENV=production.
//   ?delay=<ms>  wait before handling the request (capped at MAX_DELAY_MS)
//   ?fail=1      respond with a 500 after any delay
export const devAffordances: RequestHandler = async (req, _res, next) => {
  if (req.method !== 'GET') return next();
  const { delay, fail } = req.query;

  if (delay !== undefined) {
    if (typeof delay !== 'string' || !/^\d+$/.test(delay)) {
      throw new HttpError(400, 'bad_request', 'delay must be a non-negative integer (milliseconds)');
    }
    await sleep(Math.min(Number(delay), MAX_DELAY_MS));
  }

  if (fail !== undefined && fail !== '0' && fail !== '1') {
    throw new HttpError(400, 'bad_request', 'fail must be 0 or 1');
  }
  if (fail === '1') {
    throw new HttpError(500, 'forced_failure', 'Forced failure requested with ?fail=1');
  }
  next();
};
