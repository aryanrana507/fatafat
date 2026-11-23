import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  hi: text("hi").notNull().default(""),
  weight: text("weight").notNull().default(""),
  price: integer("price").notNull(),
  mrp: integer("mrp").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull().default(""),
  stock: integer("stock").notNull().default(0),
  source: text("source").notNull().default("dark"),
  vendor: text("vendor").notNull().default(""),
  rating: real("rating").notNull().default(4.5),
  offPct: integer("off_pct").notNull().default(0),
  description: text("description").notNull().default(""),
  bg: text("bg").notNull().default("#FFF1E6"),
  icon: text("icon").notNull().default("🛒"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const areas = sqliteTable("areas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  distKm: real("dist_km").notNull(),
  serviceable: integer("serviceable").notNull().default(1),
  storeName: text("store_name").notNull(),
  storeType: text("store_type").notNull(),
  eta: text("eta").notNull(),
  unavailableIds: text("unavailable_ids").notNull().default("[]"),
});

export const profile = sqliteTable("profile", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  currentAreaId: text("current_area_id").notNull().default("sec62"),
  referralCode: text("referral_code").notNull().default(""),
  referredBy: text("referred_by").notNull().default(""),
  coins: integer("coins").notNull().default(0),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().default(1),
  productId: integer("product_id").notNull(),
  frequency: text("frequency").notNull().default("daily"),
  qty: integer("qty").notNull().default(1),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const coinLedger = sqliteTable("coin_ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().default(1),
  kind: text("kind").notNull().default("earn"),
  amount: integer("amount").notNull().default(0),
  note: text("note").notNull().default(""),
  orderId: text("order_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const addresses = sqliteTable("addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().default(1),
  label: text("label").notNull(),
  text: text("text").notNull(),
  isActive: integer("is_active").notNull().default(0),
});

export const wishlist = sqliteTable("wishlist", {
  accountId: integer("account_id").notNull().default(1),
  productId: integer("product_id").notNull(),
}, (t) => [primaryKey({ columns: [t.accountId, t.productId] })]);

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  accountId: integer("account_id").notNull().default(1),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  addressLabel: text("address_label").notNull().default(""),
  addressText: text("address_text").notNull().default(""),
  areaId: text("area_id").notNull().default(""),
  areaName: text("area_name").notNull().default(""),
  items: text("items").notNull().default("[]"),
  itemsCount: integer("items_count").notNull().default(0),
  subtotal: integer("subtotal").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  deliveryFee: integer("delivery_fee").notNull().default(0),
  grandTotal: integer("grand_total").notNull().default(0),
  couponCode: text("coupon_code").notNull().default(""),
  coinsRedeemed: integer("coins_redeemed").notNull().default(0),
  coinsEarned: integer("coins_earned").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default("cod"),
  paymentDetail: text("payment_detail").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  deliverySlot: text("delivery_slot").notNull().default("Abhi — 8 minutes me"),
  isGift: integer("is_gift").notNull().default(0),
  giftName: text("gift_name").notNull().default(""),
  giftPhone: text("gift_phone").notNull().default(""),
  giftNote: text("gift_note").notNull().default(""),
  status: text("status").notNull().default("placed"),
  statusStep: integer("status_step").notNull().default(0),
  rating: integer("rating"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  author: text("author").notNull().default(""),
  rating: integer("rating").notNull().default(5),
  text: text("text").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const notifyMe = sqliteTable("notify_me", {
  accountId: integer("account_id").notNull().default(1),
  productId: integer("product_id").notNull(),
}, (t) => [primaryKey({ columns: [t.accountId, t.productId] })]);

export const vendors = sqliteTable("vendors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shopName: text("shop_name").notNull(),
  ownerName: text("owner_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  area: text("area").notNull().default(""),
  status: text("status").notNull().default("approved"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const vendorCoupons = sqliteTable("vendor_coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  off: integer("off").notNull().default(0),
  minOrder: integer("min_order").notNull().default(0),
  vendorName: text("vendor_name").notNull().default(""),
  enabled: integer("enabled").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/* ---------------- Admin panel + security ---------------- */

/** Single-row admin credential store. The PIN is never stored in plain
 *  text — only a salted SHA-256 hash. failed_attempts / locked_until
 *  implement the brute-force lockout (5 wrong tries → 5 minute lock). */
export const adminConfig = sqliteTable("admin_config", {
  id: integer("id").primaryKey(),
  pinHash: text("pin_hash").notNull(),
  salt: text("salt").notNull(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: integer("locked_until").notNull().default(0),
});

/** Server-side admin sessions. A token is only valid while its row
 *  exists and has not expired; every authenticated admin call slides
 *  the expiry forward, so 30 minutes of inactivity ends the session. */
export const adminSessions = sqliteTable("admin_sessions", {
  token: text("token").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});

/** Security/activity audit trail for the admin panel: logins, failed
 *  logins, lockouts, product edits/deletes, order status changes,
 *  settings changes, PIN changes, backups — with timestamps. */
export const adminActivity = sqliteTable("admin_activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/** Single-row store settings the admin can change; checkout and
 *  geofencing read these live, so changes take effect immediately. */
export const appSettings = sqliteTable("app_settings", {
  id: integer("id").primaryKey(),
  deliveryCharge: integer("delivery_charge").notNull().default(25),
  freeThreshold: integer("free_threshold").notNull().default(199),
  geofenceKm: real("geofence_km").notNull().default(2),
});

/** Platform coupons (FATA75 / FIRST50) as real rows so the admin can
 *  enable/disable or delete them; checkout validates against this. */
export const platformCoupons = sqliteTable("platform_coupons", {
  code: text("code").primaryKey(),
  off: integer("off").notNull().default(0),
  minOrder: integer("min_order").notNull().default(0),
  label: text("label").notNull().default(""),
  enabled: integer("enabled").notNull().default(1),
});

/* ---------------- Customer accounts (sign-up / login) ---------------- */

/** One row per customer account. Account id 1 is the original demo /
 *  guest profile (created from the legacy profile row, PIN empty until
 *  the owner claims it via sign-up with the same number). Login PINs are
 *  stored only as salted SHA-256 hashes, with the same 5-try lockout
 *  pattern as the admin login. */
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  pinHash: text("pin_hash").notNull().default(""),
  salt: text("salt").notNull().default(""),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: integer("locked_until").notNull().default(0),
  referralCode: text("referral_code").notNull().default(""),
  referredBy: text("referred_by").notNull().default(""),
  coins: integer("coins").notNull().default(0),
  currentAreaId: text("current_area_id").notNull().default("sec62"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const customerSessions = sqliteTable("customer_sessions", {
  token: text("token").primaryKey(),
  accountId: integer("account_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});

/** Single-row pointer to the account the app is currently acting as.
 *  Login moves it to that customer; logout moves it back to the guest
 *  account (id 1). Every customer-facing action resolves its account
 *  through this pointer, so orders/coins/subscriptions/addresses are
 *  always scoped to whoever is logged in. */
export const appState = sqliteTable("app_state", {
  id: integer("id").primaryKey(),
  currentAccountId: integer("current_account_id").notNull().default(1),
  currentSessionToken: text("current_session_token").notNull().default(""),
});

/** Help-page "Problem batao" submissions; the admin reads these in the
 *  panel and marks them resolved. */
export const supportTickets = sqliteTable("support_tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  audience: text("audience").notNull().default("customer"),
  type: text("type").notNull().default("order"),
  title: text("title").notNull(),
  message: text("message").notNull().default(""),
  isRead: integer("is_read").notNull().default(0),
  orderId: text("order_id"),
  productId: integer("product_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
