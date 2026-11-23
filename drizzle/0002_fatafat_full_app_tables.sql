DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  hi TEXT NOT NULL DEFAULT '',
  weight TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  mrp INTEGER NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'dark',
  vendor TEXT NOT NULL DEFAULT '',
  rating REAL NOT NULL DEFAULT 4.5,
  off_pct INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  bg TEXT NOT NULL DEFAULT '#FFF1E6',
  icon TEXT NOT NULL DEFAULT '🛒',
  sort_order INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dist_km REAL NOT NULL,
  serviceable INTEGER NOT NULL DEFAULT 1,
  store_name TEXT NOT NULL,
  store_type TEXT NOT NULL,
  eta TEXT NOT NULL,
  unavailable_ids TEXT NOT NULL DEFAULT '[]'
);
--> statement-breakpoint
CREATE TABLE profile (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  current_area_id TEXT NOT NULL DEFAULT 'sec62'
);
--> statement-breakpoint
CREATE TABLE addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  text TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE wishlist (
  product_id INTEGER PRIMARY KEY
);
--> statement-breakpoint
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_label TEXT NOT NULL DEFAULT '',
  address_text TEXT NOT NULL DEFAULT '',
  area_id TEXT NOT NULL DEFAULT '',
  area_name TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  items_count INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  grand_total INTEGER NOT NULL DEFAULT 0,
  coupon_code TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_detail TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'placed',
  status_step INTEGER NOT NULL DEFAULT 0,
  rating INTEGER,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audience TEXT NOT NULL DEFAULT 'customer',
  type TEXT NOT NULL DEFAULT 'order',
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  order_id TEXT,
  product_id INTEGER,
  created_at INTEGER NOT NULL
);
