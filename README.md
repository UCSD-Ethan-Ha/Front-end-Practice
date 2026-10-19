# Case Queue API

A small TypeScript + Express + SQLite API for a case queue (clients, cases, notes), built as a
backend to practise React front-end work against.

> **This is a local practice app. It is never deployed.** The seed credentials below are public
> on purpose.

## Requirements

- Node 20 or newer (Node 22 or 24 LTS recommended; Node 20 is past end-of-life)

## Install

```sh
npm install
```

## Seed the database

```sh
npm run seed
```

This drops and recreates every table in `data/app.db` (override the path with `DB_PATH`), then inserts:

- 2 users
- 8 clients
- 60 cases spread across every status and priority, including overdue cases, cases with no due
  date, unassigned cases and cases with no notes
- about 100 notes

The data is generated from a fixed random seed, so every run produces the same cases. Due dates
are relative to the day you seed, so the number of overdue cases stays realistic.

### Seed credentials

| Email | Name | Password |
|---|---|---|
| `alice@example.com` | Alice Nguyen | `password123` |
| `ben@example.com` | Ben Okafor | `password123` |

## Scripts

| Script | What it does |
|---|---|
| `npm run seed` | Reset the database and load seed data |
| `npm run typecheck` | Type-check the project without emitting files |
