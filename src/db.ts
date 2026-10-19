import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DB_PATH } from './config.js';
import { SCHEMA } from './schema.js';

export function openDb(): Database.Database {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}
