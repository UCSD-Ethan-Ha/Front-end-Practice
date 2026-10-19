import { fileURLToPath } from 'node:url';

export const DB_PATH = process.env.DB_PATH ?? fileURLToPath(new URL('../data/app.db', import.meta.url));
export const PORT = Number(process.env.PORT ?? 3000);
export const CORS_ORIGIN = 'http://localhost:5173';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const MAX_DELAY_MS = 10_000;
