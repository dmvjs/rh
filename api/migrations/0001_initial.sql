CREATE TABLE IF NOT EXISTS addresses (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  street TEXT    NOT NULL UNIQUE
);

INSERT OR IGNORE INTO addresses (street) VALUES
  ('8903 Autumn Leaf Ct'), ('8904 Autumn Leaf Ct'), ('8905 Autumn Leaf Ct'),
  ('8906 Autumn Leaf Ct'), ('8908 Autumn Leaf Ct'), ('8910 Autumn Leaf Ct'),
  ('3901 Bentwood Ct'), ('3903 Bentwood Ct'), ('3905 Bentwood Ct'), ('3907 Bentwood Ct'),
  ('3909 Bentwood Ct'), ('3910 Bentwood Ct'), ('3911 Bentwood Ct'), ('3912 Bentwood Ct'),
  ('3913 Bentwood Ct'), ('3914 Bentwood Ct'), ('3915 Bentwood Ct'), ('3916 Bentwood Ct'),
  ('3917 Bentwood Ct'), ('3918 Bentwood Ct'), ('3919 Bentwood Ct'), ('3920 Bentwood Ct'),
  ('3922 Bentwood Ct'), ('3924 Bentwood Ct'), ('3926 Bentwood Ct'), ('3927 Bentwood Ct'),
  ('8800 Glade Hill Rd'), ('8801 Glade Hill Rd'), ('8802 Glade Hill Rd'), ('8803 Glade Hill Rd'),
  ('8804 Glade Hill Rd'), ('8805 Glade Hill Rd'), ('8806 Glade Hill Rd'), ('8807 Glade Hill Rd'),
  ('8900 Glade Hill Rd'), ('8903 Glade Hill Rd'), ('8905 Glade Hill Rd'), ('8906 Glade Hill Rd'),
  ('8907 Glade Hill Rd'), ('8908 Glade Hill Rd'), ('8909 Glade Hill Rd'), ('8910 Glade Hill Rd'),
  ('8911 Glade Hill Rd'), ('8913 Glade Hill Rd'), ('8917 Glade Hill Rd'),
  ('3902 Laro Ct'), ('3903 Laro Ct'), ('3904 Laro Ct'), ('3905 Laro Ct'), ('3906 Laro Ct'),
  ('3907 Laro Ct'), ('3908 Laro Ct'), ('3909 Laro Ct'), ('3910 Laro Ct'), ('3911 Laro Ct'),
  ('3912 Laro Ct'), ('3913 Laro Ct'), ('3915 Laro Ct'), ('3917 Laro Ct'),
  ('3700 Millbank Ct'), ('3703 Millbank Ct'), ('3705 Millbank Ct'), ('3707 Millbank Ct'),
  ('3708 Millbank Ct'), ('3709 Millbank Ct'), ('3710 Millbank Ct'), ('3711 Millbank Ct'),
  ('3712 Millbank Ct'), ('3713 Millbank Ct'),
  ('3700 Moss Brooke Ct'), ('3701 Moss Brooke Ct'), ('3702 Moss Brooke Ct'), ('3703 Moss Brooke Ct'),
  ('3705 Moss Brooke Ct'), ('3706 Moss Brooke Ct'), ('3707 Moss Brooke Ct'), ('3708 Moss Brooke Ct'),
  ('3800 Moss Brooke Ct'), ('3802 Moss Brooke Ct'), ('3803 Moss Brooke Ct'), ('3804 Moss Brooke Ct'),
  ('3805 Moss Brooke Ct'), ('3806 Moss Brooke Ct'), ('3807 Moss Brooke Ct'), ('3808 Moss Brooke Ct'),
  ('3809 Moss Brooke Ct'), ('3810 Moss Brooke Ct'), ('3811 Moss Brooke Ct'),
  ('3700 Ridgelea Dr'), ('3701 Ridgelea Dr'), ('3703 Ridgelea Dr'), ('3705 Ridgelea Dr'),
  ('3706 Ridgelea Dr'), ('3707 Ridgelea Dr'), ('3710 Ridgelea Dr'), ('3711 Ridgelea Dr'),
  ('3712 Ridgelea Dr'), ('3713 Ridgelea Dr'), ('3714 Ridgelea Dr'), ('3715 Ridgelea Dr'),
  ('3716 Ridgelea Dr'), ('3717 Ridgelea Dr'), ('3718 Ridgelea Dr'), ('3722 Ridgelea Dr'),
  ('3724 Ridgelea Dr'), ('3725 Ridgelea Dr'), ('3726 Ridgelea Dr'),
  ('3800 Ridgelea Dr'), ('3802 Ridgelea Dr'), ('3803 Ridgelea Dr'), ('3805 Ridgelea Dr'),
  ('3806 Ridgelea Dr'), ('3808 Ridgelea Dr'), ('3810 Ridgelea Dr'), ('3812 Ridgelea Dr'),
  ('3814 Ridgelea Dr'), ('3816 Ridgelea Dr'),
  ('3900 Ridgelea Dr'), ('3902 Ridgelea Dr'), ('3903 Ridgelea Dr'), ('3904 Ridgelea Dr'),
  ('3905 Ridgelea Dr'), ('3907 Ridgelea Dr'), ('3909 Ridgelea Dr'), ('3910 Ridgelea Dr'),
  ('3913 Ridgelea Dr'),
  ('3800 Sandalwood Ct'), ('3801 Sandalwood Ct'), ('3802 Sandalwood Ct'), ('3803 Sandalwood Ct'),
  ('3805 Sandalwood Ct'), ('3806 Sandalwood Ct'), ('3807 Sandalwood Ct'), ('3808 Sandalwood Ct'),
  ('3809 Sandalwood Ct'), ('3810 Sandalwood Ct'), ('3811 Sandalwood Ct'), ('3812 Sandalwood Ct'),
  ('3813 Sandalwood Ct'), ('3815 Sandalwood Ct'),
  ('3900 Sandalwood Ct'), ('3901 Sandalwood Ct'), ('3902 Sandalwood Ct'), ('3903 Sandalwood Ct'),
  ('3904 Sandalwood Ct'), ('3905 Sandalwood Ct'), ('3906 Sandalwood Ct'), ('3907 Sandalwood Ct'),
  ('3908 Sandalwood Ct'), ('3909 Sandalwood Ct'), ('3910 Sandalwood Ct'), ('3911 Sandalwood Ct'),
  ('3913 Sandalwood Ct'),
  ('8800 Sandy Ridge Ct'), ('8801 Sandy Ridge Ct'), ('8802 Sandy Ridge Ct'), ('8803 Sandy Ridge Ct'),
  ('8804 Sandy Ridge Ct'), ('8805 Sandy Ridge Ct'), ('8806 Sandy Ridge Ct'), ('8807 Sandy Ridge Ct'),
  ('8808 Sandy Ridge Ct'), ('8809 Sandy Ridge Ct'), ('8810 Sandy Ridge Ct'), ('8811 Sandy Ridge Ct'),
  ('8800 Southlea Ct'), ('8801 Southlea Ct'), ('8802 Southlea Ct'), ('8803 Southlea Ct'),
  ('8804 Southlea Ct'), ('8805 Southlea Ct'), ('8806 Southlea Ct'), ('8807 Southlea Ct'),
  ('8809 Southlea Ct'), ('8810 Southlea Ct');

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  address_id    INTEGER NOT NULL REFERENCES addresses(id),
  phone         TEXT,
  note          TEXT,
  approved      INTEGER NOT NULL DEFAULT 0,
  role          TEXT    NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'moderator', 'admin')),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS listings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category      TEXT    NOT NULL,
  title         TEXT    NOT NULL,
  body          TEXT    NOT NULL,
  price         INTEGER,
  images        TEXT    NOT NULL DEFAULT '[]',
  contact_email TEXT,
  contact_phone TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at    INTEGER NOT NULL DEFAULT (unixepoch() + 2592000)
);

CREATE INDEX IF NOT EXISTS idx_listings_active_cat ON listings(category, created_at DESC) WHERE active = 1;
CREATE INDEX IF NOT EXISTS idx_listings_user       ON listings(user_id);
