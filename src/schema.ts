import { CASE_PRIORITIES, CASE_STATUSES } from './types.js';

const sqlList = (values: readonly string[]) => values.map((v) => `'${v}'`).join(', ');

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
  id          INTEGER PRIMARY KEY,
  title       TEXT NOT NULL,
  client_id   INTEGER NOT NULL REFERENCES clients(id),
  assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status      TEXT NOT NULL CHECK (status IN (${sqlList(CASE_STATUSES)})),
  priority    TEXT NOT NULL CHECK (priority IN (${sqlList(CASE_PRIORITIES)})),
  due_date    TEXT CHECK (due_date IS NULL OR due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS cases_status_idx     ON cases(status);
CREATE INDEX IF NOT EXISTS cases_priority_idx   ON cases(priority);
CREATE INDEX IF NOT EXISTS cases_assignee_idx   ON cases(assignee_id);
CREATE INDEX IF NOT EXISTS cases_due_date_idx   ON cases(due_date);
CREATE INDEX IF NOT EXISTS cases_created_at_idx ON cases(created_at);

CREATE TABLE IF NOT EXISTS notes (
  id         INTEGER PRIMARY KEY,
  case_id    INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id  INTEGER NOT NULL REFERENCES users(id),
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS notes_case_idx ON notes(case_id);
`;

// Children before parents, so foreign keys never block a drop.
export const DROP_ALL = `
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS cases;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS users;
`;
