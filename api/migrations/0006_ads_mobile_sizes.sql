-- Recreate ads table with updated size constraint to include mobile sizes
CREATE TABLE ads_new (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  size       TEXT NOT NULL CHECK(size IN ('970x66', '160x600', '320x50', '300x250')),
  image_url  TEXT NOT NULL,
  click_url  TEXT NOT NULL,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO ads_new SELECT * FROM ads;
DROP TABLE ads;
ALTER TABLE ads_new RENAME TO ads;

-- Insert mobile ad creatives
INSERT INTO ads (name, size, image_url, click_url) VALUES
  ('3Ball Racks Mobile Banner',  '320x50',  '/ads/3ball-320x50.svg',    'https://3ballracks.com'),
  ('3Ball Racks Mobile Rect',    '300x250', '/ads/3ball-300x250.svg',   'https://3ballracks.com'),
  ('Bonchon Mobile Banner',      '320x50',  '/ads/bonchon-320x50.svg',  'https://bonchon.com'),
  ('Bonchon Mobile Rect',        '300x250', '/ads/bonchon-300x250.svg', 'https://bonchon.com'),
  ('Honey Pig Mobile Banner',    '320x50',  '/ads/honeypig-320x50.svg', 'https://www.honeypigbbq.com'),
  ('Honey Pig Mobile Rect',      '300x250', '/ads/honeypig-300x250.svg','https://www.honeypigbbq.com');
