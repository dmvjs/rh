CREATE TABLE IF NOT EXISTS ads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  size       TEXT NOT NULL CHECK(size IN ('970x66', '160x600')),
  image_url  TEXT NOT NULL,
  click_url  TEXT NOT NULL,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
