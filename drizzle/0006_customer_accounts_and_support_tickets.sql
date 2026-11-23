CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  pin_hash TEXT NOT NULL DEFAULT '',
  salt TEXT NOT NULL DEFAULT '',
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT NOT NULL DEFAULT '',
  referred_by TEXT NOT NULL DEFAULT '',
  coins INTEGER NOT NULL DEFAULT 0,
  current_area_id TEXT NOT NULL DEFAULT 'sec62',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE customer_sessions (
  token TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE app_state (
  id INTEGER PRIMARY KEY,
  current_account_id INTEGER NOT NULL DEFAULT 1,
  current_session_token TEXT NOT NULL DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN account_id INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE subscriptions ADD COLUMN account_id INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE coin_ledger ADD COLUMN account_id INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE addresses ADD COLUMN account_id INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
CREATE TABLE wishlist_new (
  account_id INTEGER NOT NULL DEFAULT 1,
  product_id INTEGER NOT NULL,
  PRIMARY KEY (account_id, product_id)
);
--> statement-breakpoint
INSERT INTO wishlist_new (account_id, product_id) SELECT 1, product_id FROM wishlist;
--> statement-breakpoint
DROP TABLE wishlist;
--> statement-breakpoint
ALTER TABLE wishlist_new RENAME TO wishlist;
--> statement-breakpoint
CREATE TABLE notify_me_new (
  account_id INTEGER NOT NULL DEFAULT 1,
  product_id INTEGER NOT NULL,
  PRIMARY KEY (account_id, product_id)
);
--> statement-breakpoint
INSERT INTO notify_me_new (account_id, product_id) SELECT 1, product_id FROM notify_me;
--> statement-breakpoint
DROP TABLE notify_me;
--> statement-breakpoint
ALTER TABLE notify_me_new RENAME TO notify_me;
