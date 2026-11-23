CREATE TABLE admin_config (
  id INTEGER PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE admin_sessions (
  token TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE admin_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY,
  delivery_charge INTEGER NOT NULL DEFAULT 25,
  free_threshold INTEGER NOT NULL DEFAULT 199,
  geofence_km REAL NOT NULL DEFAULT 2
);
--> statement-breakpoint
CREATE TABLE platform_coupons (
  code TEXT PRIMARY KEY,
  off INTEGER NOT NULL DEFAULT 0,
  min_order INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1
);
--> statement-breakpoint
ALTER TABLE vendors ADD COLUMN status TEXT NOT NULL DEFAULT 'approved';
--> statement-breakpoint
ALTER TABLE vendor_coupons ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1;
