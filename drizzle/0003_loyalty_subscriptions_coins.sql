ALTER TABLE profile ADD COLUMN referral_code TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE profile ADD COLUMN referred_by TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE profile ADD COLUMN coins INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN coins_redeemed INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN coins_earned INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  qty INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE coin_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL DEFAULT 'earn',
  amount INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  order_id TEXT,
  created_at INTEGER NOT NULL
);
