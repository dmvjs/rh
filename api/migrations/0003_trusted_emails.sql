CREATE TABLE IF NOT EXISTS trusted_emails (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE,
  address    TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
