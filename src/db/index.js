'use strict'

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

const DATA_DIR = process.env.DATA_DIR || path.resolve('data')
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'bot.db')

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
}

const db = new Database(DB_FILE)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  username    TEXT,
  first_name  TEXT,
  created_at  INTEGER NOT NULL,
  last_seen   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS histories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL,
  role        TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_histories_user ON histories(user_id, id);

CREATE TABLE IF NOT EXISTS notes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL,
  text        TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id, id);

CREATE TABLE IF NOT EXISTS roles (
  user_id     TEXT PRIMARY KEY,
  prompt      TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL,
  text          TEXT NOT NULL,
  trigger_at    INTEGER NOT NULL,
  delivered_at  INTEGER,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reminders_pending
  ON reminders(delivered_at, trigger_at);
`

db.exec(SCHEMA)

module.exports = { db, DB_FILE, DATA_DIR }
