-- Switch users.address_id FK to plain text so registration
-- accepts any address without leaking the validated list.

CREATE TABLE users_new (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  address       TEXT    NOT NULL,
  phone         TEXT,
  note          TEXT,
  approved      INTEGER NOT NULL DEFAULT 0,
  role          TEXT    NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'moderator', 'admin')),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO users_new (id, name, email, password_hash, address, phone, note, approved, role, created_at)
SELECT u.id, u.name, u.email, u.password_hash,
       COALESCE(a.street, ''), u.phone, u.note, u.approved, u.role, u.created_at
FROM users u
LEFT JOIN addresses a ON a.id = u.address_id;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
