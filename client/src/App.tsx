import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "./api";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import type { Actions } from "../../server/src/actions";
import { PRODUCT_IMAGES, HERO_IMAGE } from "./images";

const FIELDS = actionFields<typeof Actions>();

type Bootstrap = ApiResponse<typeof api, "getBootstrap">;
type Product = Bootstrap["products"][number];
type Area = Bootstrap["areas"][number];
type Order = ApiResponse<typeof api, "listOrders">["orders"][number];
type Notif = ApiResponse<typeof api, "listNotifications">["notifications"][number];
type Subscription = Bootstrap["subscriptions"][number];
type CoinEntry = Bootstrap["coin_history"][number];

const CATS = [
  { id: "all", name: "Sab Kuch", icon: "🛒", bg: "#FFF1E6" },
  { id: "fruits", name: "Fruits & Sabzi", icon: "🥦", bg: "#EAF7EC" },
  { id: "dairy", name: "Dairy & Bread", icon: "🥛", bg: "#FFF7D6" },
  { id: "snacks", name: "Snacks", icon: "🍟", bg: "#FFEFE0" },
  { id: "chocolates", name: "Chocolates", icon: "🍫", bg: "#F3E5F5" },
  { id: "drinks", name: "Cold Drinks", icon: "🥤", bg: "#E6F4FF" },
  { id: "bakery", name: "Bakery", icon: "🧁", bg: "#FDECEC" },
  { id: "frozen", name: "Frozen & Ice Cream", icon: "🧊", bg: "#E3F2FD" },
  { id: "grocery", name: "Atta & Masale", icon: "🌾", bg: "#F3EAD9" },
  { id: "care", name: "Personal Care", icon: "🧴", bg: "#EDE9FF" },
  { id: "babypet", name: "Baby & Pet Care", icon: "👶", bg: "#FFF3C4" },
];

const DELIVERY_SLOTS = [
  "Abhi — 8 minutes me",
  "Aaj shaam 6–8 baje",
  "Kal subah 8–10 baje",
  "Kal dopahar 12–2 baje",
  "Kal shaam 5–7 baje",
];

const INSTRUCTION_PRESETS = ["Doorbell mat bajana", "Gate pe rakh dena", "Call karna, bell nahi", "Lift se upar aa jana"];
const UPI_APPS = ["GPay", "PhonePe", "Paytm", "BHIM"];
const WALLETS = ["Paytm Wallet", "Amazon Pay", "Mobikwik"];
const RIDER = { name: "Ramesh Kumar", vehicle: "UP16 · Bike", rating: "4.9" };

const money = (n: number) => "₹" + Math.max(0, Math.round(n));
const escTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

function loadCart(): Record<number, number> {
  try {
    const raw = localStorage.getItem("fatafat-cart");
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Record<number, number>;
  } catch { /* ignore */ }
  return {};
}

type Sheet =
  | { kind: "cart" }
  | { kind: "product"; id: number }
  | { kind: "notifications" }
  | { kind: "areas" }
  | { kind: "profile" }
  | { kind: "staff" }
  | { kind: "admin" }
  | { kind: "auth" }
  | { kind: "help" }
  | { kind: "assistant" }
  | { kind: "bill"; orderId: string }
  | { kind: "tracking"; orderId: string }
  | null;

/** Product photo with a graceful tile fallback for vendor-added products
 *  that have no photo yet (icon on the product's pastel tile). */
function PImg({ p, className, alt }: { p: Product; className?: string; alt: string }) {
  const src = PRODUCT_IMAGES[p.id];
  if (src) return <img src={src} alt={alt} className={className} loading="lazy" />;
  return (
    <div className={`${className ?? ""} grid place-items-center`} style={{ background: p.bg }} role="img" aria-label={alt}>
      <span className="text-4xl">{p.icon}</span>
    </div>
  );
}

/** Scroll-triggered side reveal: the wrapped block starts slightly offset
 *  (from the left or right) and faded, then glides into place when ~15% of
 *  it enters the viewport; once revealed it stays revealed. The reveal is
 *  genuinely scroll-driven — below-fold blocks stay offset until the user
 *  scrolls to them. Safety nets so content the user has REACHED can never
 *  get stuck invisible: no IntersectionObserver → reveal immediately; a
 *  scroll/interval position check reveals any block that has reached the
 *  viewport (or been scrolled past) even if the observer hiccups; a long
 *  15s backstop timer covers everything else; and prefers-reduced-motion
 *  users start (and stay) plainly visible — the CSS also forces .ff-slide
 *  visible in that mode. */
function Reveal({ from = "left", delay = 0, className = "", children }: {
  from?: "left" | "right";
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState<boolean>(() => {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
  });
  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver !== "function") { setShown(true); return; }
    let done = false;
    const reveal = () => { if (!done) { done = true; setShown(true); } };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { reveal(); io.disconnect(); }
    }, { threshold: 0.15, rootMargin: "0px 0px 10% 0px" });
    io.observe(el);
    // Observer-independent safety: if this block has reached the viewport
    // (top edge at/above the viewport bottom — in view or already scrolled
    // past) but the observer never fired, reveal it anyway. Blocks still
    // below the fold are untouched, so their scroll-in slide still happens.
    const checkReached = () => {
      if (el.getBoundingClientRect().top < window.innerHeight * 1.5) reveal();
    };
    checkReached();
    const iv = setInterval(checkReached, 300);
    window.addEventListener("scroll", checkReached, { passive: true });
    // Hard cap: nothing stays hidden longer than ~1.2s, so every control
    // is always reachable/operable even if no scroll ever happens.
    const t = setTimeout(reveal, 1200);
    return () => {
      io.disconnect();
      clearInterval(iv);
      clearTimeout(t);
      window.removeEventListener("scroll", checkReached);
    };
  }, [shown]);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`ff-slide ${from === "right" ? "ff-slide-r" : "ff-slide-l"} ${shown ? "ff-in" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function App() {
  const queryClient = useQueryClient();
  const bootstrap = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => api.getBootstrap({}),
    refetchInterval: 15000,
  });

  const [cart, setCart] = useState<Record<number, number>>(loadCart);
  const [cartStartedAt, setCartStartedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("pop");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [chatByOrder, setChatByOrder] = useState<Record<string, { from: "me" | "rider"; text: string }[]>>({});
  const [trackingChatFor, setTrackingChatFor] = useState<string | null>(null);
  const [dark, setDark] = useState<boolean>(() => {
    try { return localStorage.getItem("fatafat-theme") === "dark"; } catch { return false; }
  });
  const [listening, setListening] = useState(false);
  const [custToken, setCustToken] = useState<string>(() => {
    try { return localStorage.getItem("fatafat-customer-token") ?? ""; } catch { return ""; }
  });

  // On start, drop a stored customer token the server no longer accepts
  // (expired / logged out elsewhere) so Profile never claims a dead login.
  useEffect(() => {
    if (!custToken) return;
    api.customerSessionCheck({ token: custToken })
      .then((r) => {
        if (!r.valid) {
          setCustToken("");
          try { localStorage.removeItem("fatafat-customer-token"); } catch { /* ignore */ }
        }
      })
      .catch(() => { /* offline — token agle start par phir check hoga */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoggedIn = (token: string, name: string) => {
    setCustToken(token);
    try { localStorage.setItem("fatafat-customer-token", token); } catch { /* storage blocked — session server par hai */ }
    void queryClient.invalidateQueries();
    showToast(`🎉 Welcome, ${name}! Tumhara account load ho gaya — orders, coins, sab tumhara.`);
    setSheet({ kind: "profile" });
  };

  const custLogout = useMutation({
    mutationFn: async () => await api.customerLogout({ token: custToken }),
    onSuccess: () => {
      setCustToken("");
      try { localStorage.removeItem("fatafat-customer-token"); } catch { /* ignore */ }
      void queryClient.invalidateQueries();
      showToast("🚪 Logout ho gaya — ab Guest (Demo) account active hai");
      setSheet(null);
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Logout nahi hua"),
  });

  useEffect(() => {
    try {
      if (dark) document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("fatafat-theme", dark ? "dark" : "light");
    } catch { /* storage blocked — theme sirf is session ke liye lagega */ }
  }, [dark]);

  const voiceSearch = () => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (typeof Ctor !== "function") {
      showToast("🎤 Is browser me voice search support nahi hai — type karke search karo");
      return;
    }
    try {
      const Rec = Ctor as new () => {
        lang: string; interimResults: boolean;
        onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onend: (() => void) | null; onerror: (() => void) | null; start: () => void;
      };
      const rec = new Rec();
      rec.lang = "hi-IN";
      rec.interimResults = false;
      setListening(true);
      rec.onresult = (e) => {
        const t = e.results[0]?.[0]?.transcript ?? "";
        if (t) { setQuery(t); setSuggestOpen(true); }
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => { setListening(false); showToast("🎤 Awaaz samajh nahi aayi — phir try karo"); };
      rec.start();
      showToast("🎤 Bolo… kya chahiye? (jaise 'doodh')");
    } catch {
      setListening(false);
      showToast("🎤 Voice search shuru nahi hua — type karke search karo");
    }
  };

  useEffect(() => {
    // The artifact runs in a sandboxed iframe where Web Storage can be
    // blocked: localStorage.setItem then throws a SecurityError. This
    // effect runs on mount, and an uncaught throw here unmounts the whole
    // React tree — the page goes completely blank (only the body
    // background shows). loadCart() already guards its read; the write
    // must be guarded the same way. If storage is unavailable the cart
    // simply lives in memory for the session.
    try {
      localStorage.setItem("fatafat-cart", JSON.stringify(cart));
    } catch { /* storage blocked — cart stays in-memory only */ }
    if (Object.keys(cart).length > 0 && cartStartedAt === null) setCartStartedAt(Date.now());
    if (Object.keys(cart).length === 0) setCartStartedAt(null);
  }, [cart, cartStartedAt]);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  };

  const data = bootstrap.data;
  const products = useMemo(() => data?.products ?? [], [data]);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const areas = data?.areas ?? [];
  const area: Area | undefined =
    areas.find((a) => a.id === data?.profile.current_area_id) ?? areas[0];
  const wishlist = useMemo(() => new Set(data?.wishlist_ids ?? []), [data]);
  const notifySet = useMemo(() => new Set(data?.notify_ids ?? []), [data]);

  const isUnavailable = (p: Product) => (area?.unavailable_ids ?? []).includes(p.id);
  const isOOS = (p: Product) => p.stock <= 0;

  const cartEntries = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: byId.get(Number(id)), qty }))
        .filter((e): e is { product: Product; qty: number } => !!e.product && e.qty > 0),
    [cart, byId],
  );
  const cartCount = cartEntries.reduce((s, e) => s + e.qty, 0);
  const cartSubtotal = cartEntries.reduce((s, e) => s + e.product.price * e.qty, 0);
  const cartMrpTotal = cartEntries.reduce((s, e) => s + e.product.mrp * e.qty, 0);
  const cartElapsed = cartStartedAt ? Math.floor((Date.now() - cartStartedAt) / 1000) : 0;

  const changeQty = (p: Product, delta: number) => {
    if (delta > 0) {
      if (isUnavailable(p)) { showToast("Ye item is area ke store me nahi hai"); return; }
      if (isOOS(p)) { showToast("Out of Stock — stock khatm ho gaya"); return; }
      const cur = cart[p.id] ?? 0;
      if (cur + delta > p.stock) { showToast(`Sirf ${p.stock} hi stock me hain`); return; }
    }
    setCart((prev) => {
      const next = { ...prev };
      const q = (next[p.id] ?? 0) + delta;
      if (q <= 0) delete next[p.id]; else next[p.id] = q;
      return next;
    });
    if (delta > 0) showToast(`${p.name} cart me add ho gaya ✓`);
  };

  const wishMutation = useMutation({
    mutationFn: async (productId: number) => await api.toggleWishlist({ product_id: productId }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      showToast(res.wishlisted ? "Wishlist me save ❤️" : "Wishlist se hataya");
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Wishlist update nahi hua"),
  });

  const notifyMutation = useMutation({
    mutationFn: async (productId: number) => await api.toggleNotifyMe({ product_id: productId }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      showToast(res.subscribed ? "🔔 Notify Me lag gaya — stock aate hi bell me alert milega!" : "Notify Me hata diya");
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Notify Me nahi laga"),
  });

  const subscribeMutation = useMutation({
    mutationFn: async (v: { product: Product; frequency: "daily" | "weekly"; qty: number }) =>
      await api.createSubscription({ product_id: v.product.id, frequency: v.frequency, qty: v.qty }),
    onSuccess: (res, v) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        showToast(`🔄 Subscription shuru! ${v.frequency === "daily" ? "Roz" : "Har hafte"} ${v.qty} × ${v.product.name} aayega`);
      } else showToast(res.error || "Subscription nahi bani");
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Subscription nahi bani"),
  });

  const areaMutation = useMutation({
    mutationFn: async (areaId: string) => await api.setCurrentArea({ area_id: areaId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["bootstrap"] }),
    onError: (e) => showToast(e instanceof Error ? e.message : "Area save nahi hua"),
  });

  const selectArea = (a: Area) => {
    areaMutation.mutate(a.id);
    if (a.serviceable) showToast(`Area: ${a.name} · ${a.store_name}`);
    else showToast(`⚠ Ye area ${data?.settings.geofence_km ?? 2} km radius ke bahar hai — delivery nahi hogi`);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter(
      (p) =>
        (q !== "" || activeCat === "all" || p.category === activeCat) &&
        (q === "" ||
          p.name.toLowerCase().includes(q) ||
          p.hi.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)),
    );
    list = [...list];
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    if (sort === "high") list.sort((a, b) => b.price - a.price);
    if (sort === "off") list.sort((a, b) => b.off - a.off);
    return list;
  }, [products, query, activeCat, sort]);

  const suggestions = useQuery({
    queryKey: ["suggest", query],
    queryFn: () => api.getSearchSuggestions({ query }),
    enabled: suggestOpen,
  });

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.listOrders({ limit: 20 }),
    refetchInterval: 6000,
  });
  const orders = ordersQuery.data?.orders ?? [];
  const activeOrder = orders.find((o) => o.status !== "delivered" && o.status !== "cancelled");

  const reorder = (order: Order) => {
    const next: Record<number, number> = {};
    let skipped = 0;
    for (const line of order.items) {
      const p = byId.get(line.product_id);
      if (p && p.stock > 0 && !isUnavailable(p)) next[p.id] = Math.min(line.qty, p.stock);
      else skipped++;
    }
    if (Object.keys(next).length === 0) { showToast("Is order ka koi item abhi available nahi hai"); return; }
    setCart(next);
    showToast(skipped > 0 ? `Re-order ho gaya ✓ (${skipped} item abhi available nahi tha)` : "Re-order ho gaya ✓ — purana samaan cart me hai");
    setSheet({ kind: "cart" });
  };

  const qtyBtn = (p: Product) => {
    if (isUnavailable(p))
      return <button type="button" disabled className="rounded-[10px] border-[1.5px] border-[var(--border)] px-3 py-2 text-sm font-black text-[var(--dim)] opacity-60">Is Area Me Nahi</button>;
    if (isOOS(p))
      return notifySet.has(p.id) ? (
        <button type="button" aria-label={`${p.name} ke liye back-in-stock alert laga hai`} onClick={() => notifyMutation.mutate(p.id)}
          className="min-w-[86px] rounded-[10px] border-[1.5px] border-[var(--green)] bg-[var(--green-bg)] px-3 py-2 text-[13px] font-black text-[var(--green)] transition-transform duration-150 active:scale-95">
          🔔 Alert Lagega ✓
        </button>
      ) : (
        <button type="button" aria-label={`${p.name} wapas aane par notify karo`} onClick={() => notifyMutation.mutate(p.id)}
          className="min-w-[86px] rounded-[10px] border-[1.5px] border-[var(--accent)] bg-[var(--surface)] px-3 py-2 text-[13px] font-black text-[var(--accent-dark)] transition-transform duration-150 active:scale-95">
          🔔 Notify Me
        </button>
      );
    const q = cart[p.id] ?? 0;
    if (!q)
      return (
        <button type="button" aria-label={`${p.name} add karo`} onClick={() => changeQty(p, 1)}
          className="min-w-[86px] rounded-[10px] border-[1.5px] border-[var(--green)] bg-[var(--surface)] px-4 py-2 font-black text-[var(--green)] shadow-sm transition-transform duration-150 active:scale-95">
          ADD +
        </button>
      );
    return (
      <div className="ff-pop flex min-w-[88px] items-center justify-between overflow-hidden rounded-[10px] bg-[var(--green)] text-white">
        <button type="button" aria-label={`${p.name} ek kam karo`} onClick={() => changeQty(p, -1)} className="w-9 text-xl font-black transition-transform duration-100 active:scale-75">−</button>
        <span key={q} className="ff-pop font-black" aria-label={`${p.name} quantity ${q}`}>{q}</span>
        <button type="button" aria-label={`${p.name} ek aur jodo`} onClick={() => changeQty(p, 1)} className="w-9 text-xl font-black transition-transform duration-100 active:scale-75">+</button>
      </div>
    );
  };

  if (bootstrap.isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg)] px-6 text-center">
        <div>
          <div className="ff-logo-pulse font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--accent-dark)]">fata<span className="text-[var(--accent)]">fat</span></div>
          <p className="mt-3 text-sm text-[var(--dim)]">Store khul raha hai… database se live stock aa raha hai 🧡</p>
        </div>
      </div>
    );
  }
  if (bootstrap.error || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg)] px-6 text-center">
        <div>
          <p className="text-lg font-bold">Store load nahi hua 😕</p>
          <p className="mt-2 text-sm text-[var(--dim)]">Backend se data nahi aaya. Ek baar phir try karo.</p>
          <button type="button" onClick={() => void bootstrap.refetch()} className="mt-4 rounded-full bg-[var(--accent)] px-5 py-2.5 font-black text-white">Phir Try Karo</button>
        </div>
      </div>
    );
  }

  const activeAddr = data.addresses.find((a) => a.is_active) ?? data.addresses[0];
  const unread = data.unread_notifications;

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-[130px] text-[var(--text)]">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-40 bg-gradient-to-b from-[#FF6A00] to-[#FF7E1F] px-4 pb-4 pt-safe text-white shadow-lg">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-none">Delivery in {area?.serviceable ? "8" : "—"} minutes</div>
              <button type="button" onClick={() => setSheet({ kind: "areas" })}
                className="mt-2 block w-full max-w-[560px] truncate rounded-[10px] border border-white/25 bg-white/15 px-2.5 py-1.5 text-left text-[13px]">
                📍 {activeAddr ? `${activeAddr.label} — ${activeAddr.text}` : "Address chuno"} ▾
              </button>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" aria-label={dark ? "Light mode karo" : "Dark mode karo"} onClick={() => setDark((d) => !d)}
                className="grid h-[46px] w-[46px] place-items-center rounded-full border-2 border-white/60 bg-white text-[19px] transition-transform duration-150 active:scale-90" title="Dark / Light Mode">
                {dark ? "☀️" : "🌙"}
              </button>
              <button type="button" aria-label="AI order assistant kholo" onClick={() => setSheet({ kind: "assistant" })}
                className="grid h-[46px] w-[46px] place-items-center rounded-full border-2 border-white/60 bg-white text-[19px] transition-transform duration-150 active:scale-90" title="AI Assistant">
                🤖
              </button>
              <button type="button" aria-label="Store staff panel kholo" onClick={() => setSheet({ kind: "staff" })}
                className="grid h-[46px] w-[46px] place-items-center rounded-full border-2 border-white/60 bg-white text-[19px] transition-transform duration-150 active:scale-90" title="Staff Panel">
                🏪
              </button>
              <button type="button" aria-label="Notifications kholo" onClick={() => setSheet({ kind: "notifications" })}
                className="relative grid h-[46px] w-[46px] place-items-center rounded-full border-2 border-white/60 bg-white text-[19px] transition-transform duration-150 active:scale-90">
                🔔
                {unread > 0 && (
                  <span className="ff-pop absolute -right-0.5 -top-0.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-[#D92D20] px-1 text-[10px] font-black text-white">{unread}</span>
                )}
              </button>
              <button type="button" aria-label="Profile kholo" onClick={() => setSheet({ kind: "profile" })}
                className="relative grid h-[46px] w-[46px] place-items-center rounded-full border-2 border-white/60 bg-white text-lg font-black text-[var(--accent-dark)] transition-transform duration-150 active:scale-90">
                {(data.profile.name || "A").charAt(0).toUpperCase()}
                {wishlist.size > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-[var(--green)] px-1 text-[10px] font-black text-white">{wishlist.size}</span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <div className="font-[family-name:var(--font-display)] text-[32px] font-extrabold leading-none">fata<span className="text-[#FFE9B8]">fat</span></div>
            <button type="button" onClick={() => { setSheet({ kind: "cart" }); showToast("Cart me FATA75 lagao — ₹299+ par ₹75 OFF"); }}
              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[var(--accent-dark)]">
              Pehla order? FATA75 lagao →
            </button>
            <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide">⚡ Backend Live · DB Stock</span>
            <button type="button" onClick={() => setSheet({ kind: "profile" })}
              className="rounded-full bg-[#FFD23F] px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[#5C3A00]">
              🪙 {data.profile.coins} Coins · Wallet →
            </button>
          </div>

          <div className="relative mt-3">
            <label className="flex items-center gap-2 rounded-[14px] bg-white px-3.5 shadow-md">
              <span aria-hidden="true">🔍</span>
              <input
                {...FIELDS.getSearchSuggestions.query}
                type="search" value={query} aria-label="Products search karo"
                placeholder='Search "doodh", "milk", "chips"…'
                className="min-h-[48px] min-w-0 flex-1 bg-transparent text-base text-[#222] outline-none"
                onChange={(e) => { setQuery(e.target.value); setSuggestOpen(true); }}
                onFocus={() => setSuggestOpen(true)}
                onBlur={() => setTimeout(() => setSuggestOpen(false), 200)}
              />
              {query && (
                <button type="button" aria-label="Search saaf karo" onClick={() => { setQuery(""); }}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FFF1E6] font-black text-[var(--accent-dark)]">✕</button>
              )}
              <button type="button" aria-label="Bolkar search karo (voice search)" onClick={voiceSearch}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[17px] transition-transform duration-150 active:scale-90 ${listening ? "ff-pop bg-[#D92D20] text-white" : "bg-[#FFF1E6]"}`}>
                🎤
              </button>
            </label>
            {suggestOpen && suggestions.data && (
              <div className="ff-drop-in absolute inset-x-0 top-[calc(100%+8px)] z-[60] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left text-[var(--text)] shadow-2xl">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--dim)]">✨ AI Suggestions — Top Brands</h4>
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {suggestions.data.brands.map((b) => (
                    <button key={b} type="button" onClick={() => { setQuery(b); setSuggestOpen(false); }}
                      className="rounded-full border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-[13px] font-extrabold">{b}</button>
                  ))}
                </div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--dim)]">Suggested Products</h4>
                {suggestions.data.products.length === 0 && <p className="text-[13px] text-[var(--dim)]">Is search ke liye suggestion nahi mila.</p>}
                {suggestions.data.products.map((p) => (
                  <button key={p.id} type="button" onClick={() => { setSuggestOpen(false); setSheet({ kind: "product", id: p.id }); }}
                    className="mt-1.5 flex w-full items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-left">
                    <PImg p={p} alt="" className="h-[42px] w-[42px] shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-sm">{p.name}</b>
                      <span className="text-xs text-[var(--dim)]">{p.brand} · {p.weight} · {p.stock <= 0 ? "Out of Stock" : `Stock: ${p.stock}`}</span>
                    </span>
                    <b>{money(p.price)}</b>
                  </button>
                ))}
                <p className="mt-2 text-xs text-[var(--dim)]">Try: "milk" likho — Amul ke doodh turant upar aayenge.</p>
              </div>
            )}
          </div>

          <Reveal from="left" className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text)]">
              <span>🏪 <b>{area?.store_name}</b> · {area?.store_type}</span>
              <span>📍 Radius <b>{data.settings.geofence_km} km</b> · {area?.eta} · {area?.serviceable ? `Tum service area ke andar ho ✓ (${area.dist_km} km)` : `⚠ ${area?.dist_km} km — radius ke bahar`}</span>
              <button type="button" onClick={() => setSheet({ kind: "areas" })} className="font-black text-[var(--accent-dark)]">Area Badlo →</button>
            </div>
          </Reveal>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="opacity-90">Popular:</span>
            {["doodh", "aam", "chips", "paneer", "ice cream"].map((w) => (
              <button key={w} type="button" onClick={() => setQuery(w)}
                className="rounded-full border border-white/35 bg-white/20 px-3 py-1.5 font-bold capitalize text-white">{w}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4">
        {/* ---------- Hero ---------- */}
        <section className="ff-reveal mt-4 grid overflow-hidden rounded-[22px] bg-[#FF6A00] shadow-lg md:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 text-white md:p-7">
            <h1 className="font-[family-name:var(--font-display)] text-[34px] font-extrabold leading-[0.95] md:text-[38px]">Groceries,<br />fatafat ghar par.</h1>
            <p className="mb-4 mt-2.5 font-semibold leading-relaxed opacity-95">Doodh, sabzi, snacks, atta — sab kuch 8 minute me. Ab pura backend ke saath: order database me save hota hai, stock sach me ghat-ta hai!</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-full bg-white px-4 py-2.5 font-black text-[var(--accent-dark)]">Abhi order karo →</button>
              <button type="button" onClick={() => setSheet({ kind: "staff" })}
                className="rounded-full border-[1.5px] border-white/70 px-4 py-2.5 font-black text-white">🏪 Staff Panel Dekho</button>
            </div>
          </div>
          <img src={HERO_IMAGE} alt="Fatafat delivery scooter with fresh groceries" className="h-[170px] w-full object-cover md:h-full md:min-h-[210px]" />
        </section>

        {/* ---------- Category pills ---------- */}
        <Reveal from="right">
        <div className="flex flex-wrap gap-2.5 pb-1.5 pt-4" aria-label="Categories">
          {CATS.map((c) => (
            <button key={c.id} type="button" onClick={() => setActiveCat(c.id)}
              className={`whitespace-nowrap rounded-full border-[1.5px] px-4 py-2.5 font-extrabold transition-all duration-200 active:scale-95 ${activeCat === c.id ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
        </Reveal>

        <Reveal from="left">
        <div className="mb-3.5 mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-none">Shop by category</h2>
            <p className="mt-1 text-sm text-[var(--dim)]">Kisi category par tap karo — neeche wahi items dikhenge</p>
          </div>
          <button type="button" onClick={() => setActiveCat("all")} className="rounded-full border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-bold">Sab dikhao</button>
        </div>
        </Reveal>
        <div className="grid grid-cols-4 gap-3 md:grid-cols-5">
          {CATS.slice(1).map((c, i) => (
            <Reveal key={c.id} from={i % 2 === 0 ? "left" : "right"} delay={(i % 4) * 60} className="h-full">
              <button type="button" onClick={() => { setActiveCat(c.id); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}
                className="h-full w-full rounded-[18px] border border-[var(--border)] p-3 text-center transition-transform duration-150 active:scale-[0.96]" style={{ background: c.bg }}>
                <div className="text-[32px]">{c.icon}</div>
                <b className="mt-1.5 block text-[13px] leading-tight text-[#1E140C]">{c.name}</b>
                <span className="text-xs text-[#7A6A5E]">{products.filter((p) => p.category === c.id).length} items →</span>
              </button>
            </Reveal>
          ))}
        </div>

        {/* ---------- Offers ---------- */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Reveal from="left" className="h-full">
            <button type="button" onClick={() => setSheet({ kind: "cart" })} className="h-full w-full rounded-2xl bg-gradient-to-br from-[#FF5E00] to-[#FF8A00] p-4 text-left text-white transition-transform duration-150 active:scale-[0.98]">
              <b className="block text-lg">FATA75 — ₹75 OFF</b>
              <span className="mt-0.5 block text-[13px] opacity-95">₹299+ ke order par · Cart me coupon server se verify hota hai</span>
              <em className="mt-2.5 inline-block rounded-full bg-white/20 px-2 py-1 text-xs font-black not-italic">Cart kholo →</em>
            </button>
          </Reveal>
          <Reveal from="right" delay={80} className="h-full">
            <button type="button" onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })} className="h-full w-full rounded-2xl bg-gradient-to-br from-[#0C831F] to-[#22A33A] p-4 text-left text-white transition-transform duration-150 active:scale-[0.98]">
              <b className="block text-lg">FREE Delivery</b>
              <span className="mt-0.5 block text-[13px] opacity-95">{money(data.settings.free_threshold)}+ par delivery bilkul free · Cart bharo aur dekho</span>
              <em className="mt-2.5 inline-block rounded-full bg-white/20 px-2 py-1 text-xs font-black not-italic">Shop karo →</em>
            </button>
          </Reveal>
          <Reveal from="left" delay={160} className="h-full">
            <button type="button" onClick={() => setActiveCat("dairy")} className="h-full w-full rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#9D6BFF] p-4 text-left text-white transition-transform duration-150 active:scale-[0.98]">
              <b className="block text-lg">Subah Fresh — Doodh &amp; Bread</b>
              <span className="mt-0.5 block text-[13px] opacity-95">Roz subah fresh dairy · Is category me dekho</span>
              <em className="mt-2.5 inline-block rounded-full bg-white/20 px-2 py-1 text-xs font-black not-italic">Dairy kholo →</em>
            </button>
          </Reveal>
        </div>

        {/* ---------- Feature strip ---------- */}
        <div className="my-5 grid gap-3 md:grid-cols-3">
          <Reveal from="left" className="h-full">
            <div className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <b className="mb-1 block">🏪 Hybrid Model — Dono!</b>
              <p className="text-sm leading-relaxed text-[var(--dim)]">Apne Dark Stores + partner dukaanen (Sharma, Gupta, City Care). Har product par source tag dikhta hai ki samaan kaha se aayega.</p>
            </div>
          </Reveal>
          <Reveal from="right" delay={80} className="h-full">
            <div className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <b className="mb-1 block">🗄️ Asli Backend — Database</b>
              <p className="text-sm leading-relaxed text-[var(--dim)]">Products, stock, orders, notifications — sab server ki database me hai. Page refresh karo, data waisa ka waisa milega. Order karte hi stock sabke liye ghat jata hai.</p>
            </div>
          </Reveal>
          <Reveal from="left" delay={160} className="h-full">
            <div className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <b className="mb-1 block">📦 Live Inventory Sync</b>
              <p className="text-sm leading-relaxed text-[var(--dim)]">Bik gaya to Out of Stock, 5 se kam bacha to "Sirf X bache!" aur vendor ko alert. Staff panel se restock bhi hota hai.</p>
            </div>
          </Reveal>
        </div>

        {/* ---------- Product grid ---------- */}
        <Reveal from="left">
        <div className="mb-3.5 mt-6 flex flex-wrap items-end justify-between gap-3" id="shop">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-none">
              {query ? `"${query}" ke results` : activeCat === "all" ? "Bestsellers" : CATS.find((c) => c.id === activeCat)?.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--dim)]">{filtered.length} items mile · Live DB stock · Product par tap = details</p>
          </div>
          <label className="sr-only" htmlFor="sortSel">Products sort karo</label>
          <select id="sortSel" value={sort} onChange={(e) => setSort(e.target.value)}
            className="rounded-full border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-bold">
            <option value="pop">Sort: Popular</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
            <option value="off">Discount</option>
          </select>
        </div>
        </Reveal>

        {filtered.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-9 text-center text-[var(--dim)]">
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text)]">Kuch nahi mila 😕</h3>
            <p>"{query}" ke liye kuch nahi hai. Doosra word try karo.</p>
            <button type="button" onClick={() => { setQuery(""); setActiveCat("all"); }} className="mt-2.5 rounded-[10px] border-[1.5px] border-[var(--green)] px-4 py-2 font-black text-[var(--green)]">Sab products dikhao</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p, i) => (
              <Reveal key={p.id} from={i % 2 === 0 ? "left" : "right"} delay={(i % 4) * 70} className="h-full">
              <article className="relative flex h-full flex-col overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)]">
                <button type="button" onClick={() => setSheet({ kind: "product", id: p.id })} aria-label={`${p.name} ki details`}
                  className="group relative block h-[138px] w-full overflow-hidden p-0" style={{ background: p.bg }}>
                  <PImg p={p} alt={`${p.name} ki asli photo`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                  {p.off > 0 && <span className="absolute left-2.5 top-2.5 rounded-md bg-[var(--accent)] px-1.5 py-1 text-[11px] font-black text-white">{p.off}% OFF</span>}
                  <span className="absolute bottom-2 left-2.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[11px] font-extrabold text-[#333]">⏱ 8 MINS</span>
                  {isOOS(p) && <span className="absolute inset-0 z-[1] grid place-items-center bg-white/70 text-[15px] font-black text-[#B42318]">OUT OF STOCK</span>}
                  {!isOOS(p) && isUnavailable(p) && <span className="absolute inset-0 z-[1] grid place-items-center bg-white/70 text-[15px] font-black text-[#B42318]">IS AREA ME NAHI</span>}
                </button>
                <button type="button" aria-label={`${p.name} wishlist`} onClick={() => wishMutation.mutate(p.id)}
                  className={`absolute right-2 top-2 z-[2] grid h-[38px] w-[38px] place-items-center rounded-full border text-[17px] transition-transform duration-150 active:scale-75 ${wishlist.has(p.id) ? "border-[#FFB59A] bg-[#FFE8E0]" : "border-[var(--border)] bg-white"}`}>
                  {wishlist.has(p.id) ? "❤️" : "🤍"}
                </button>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <div className="text-xs font-extrabold text-[var(--green)]">★ {p.rating}{p.review_count > 0 ? ` · ${p.review_count} reviews` : ""} · {p.brand}</div>
                  <h3 className="cursor-pointer text-[15px] font-extrabold leading-snug" onClick={() => setSheet({ kind: "product", id: p.id })}>{p.name}</h3>
                  <div className="text-[13px] text-[var(--dim)]">{p.weight} · {p.hi}</div>
                  <div>
                    <span className="inline-block rounded-full bg-[#FFF1E6] px-1.5 py-0.5 text-[11px] font-extrabold text-[#8A3A00]">
                      {p.source === "dark" ? "🏪 Fatafat Dark Store" : `🏬 Partner: ${p.vendor}`}
                    </span>
                  </div>
                  <div className="text-xs">
                    {isOOS(p) ? <span className="font-black text-[#B42318]">Out of Stock — stock khatm</span>
                      : isUnavailable(p) ? <span className="font-black text-[#B42318]">Is area ke store me nahi hai</span>
                      : p.stock <= 5 ? <span className="font-black text-[#B42318]">🔥 Sirf {p.stock} bache!</span>
                      : <span className="font-extrabold text-[var(--green)]">Stock: {p.stock} available</span>}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <div><b className="text-base">{money(p.price)}</b>{p.mrp > p.price && <s className="ml-1 text-[13px] text-[var(--dim)]">{money(p.mrp)}</s>}</div>
                    {qtyBtn(p)}
                  </div>
                </div>
              </article>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal from="left">
          <footer className="py-6 text-[13px] leading-relaxed text-[var(--dim)]">
            <p><strong className="text-[var(--text)]">Fatafat Full App</strong> — ab asli backend ke saath: products, live stock, orders aur notifications server ki database me save hote hain. Payment abhi demo mode me hai — asli paiso ke liye apna payment provider (Razorpay/PhonePe type) account connect karna hoga; asli GPS tracking ke liye bhi rider app lagega.</p>
            <p className="mt-1">Made fresh every morning · Fatafat © 2026 · <button type="button" className="font-extrabold text-[var(--accent-dark)]" onClick={() => setSheet({ kind: "profile" })}>My Orders dekho</button></p>
            <p className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setSheet({ kind: "help" })} className="rounded-full border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 font-black text-[var(--text)]">❓ Help &amp; Support</button>
              <button type="button" onClick={() => setSheet({ kind: "auth" })} className="rounded-full border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 font-black text-[var(--text)]">👤 {data.profile.is_guest ? "Login / Sign Up" : `${data.profile.name} — My Account`}</button>
              <button type="button" onClick={() => setSheet({ kind: "admin" })} className="rounded-full border-[1.5px] border-[#1E140C] bg-[#1E140C] px-3.5 py-2 font-black text-white">🔐 Admin Panel (Owner)</button>
            </p>
          </footer>
        </Reveal>
      </main>

      {/* ---------- Floating bars ---------- */}
      {activeOrder && sheet?.kind !== "tracking" && (
        <button type="button" onClick={() => setSheet({ kind: "tracking", orderId: activeOrder.id })}
          className={`ff-bar-in fixed left-1/2 z-50 flex w-[min(680px,calc(100%-24px))] -translate-x-1/2 items-center justify-between rounded-2xl bg-[#FF5E00] px-4 py-3 text-left text-white shadow-2xl transition-transform duration-150 active:scale-[0.98] ${cartCount > 0 ? "bottom-[92px]" : "bottom-4"}`}>
          <span><b className="block text-[15px]">🛵 Order {activeOrder.id} — {activeOrder.status_label}</b><span className="block text-xs opacity-90">Tracking dekho →</span></span>
          <span className="font-black">Track ›</span>
        </button>
      )}
      {cartCount > 0 && (
        <button type="button" onClick={() => setSheet({ kind: "cart" })}
          className="ff-bar-in fixed bottom-4 left-1/2 z-50 flex w-[min(680px,calc(100%-24px))] -translate-x-1/2 items-center justify-between rounded-2xl bg-[var(--green)] px-4 py-3 text-left text-white shadow-2xl transition-transform duration-150 active:scale-[0.98]">
          <span>
            <b className="block text-[15px]">{cartCount} items · {money(cartSubtotal)}{cartMrpTotal > cartSubtotal ? ` · ${money(cartMrpTotal - cartSubtotal)} bachat` : ""}</b>
            <span className="block text-xs opacity-90">⚡ Instant cart · {cartElapsed > 0 ? `${Math.floor(cartElapsed / 60)}:${String(cartElapsed % 60).padStart(2, "0")} se cart live hai · ` : ""}Cart dekho →</span>
          </span>
          <span className="font-black">View Cart ›</span>
        </button>
      )}

      {toast && (
        <div role="status" className="ff-toast-in fixed bottom-[150px] left-1/2 z-[120] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-full bg-[#1E140C] px-4 py-2.5 text-center font-extrabold text-white shadow-xl">{toast}</div>
      )}

      {/* ---------- Sheets ---------- */}
      {sheet && (
        <div className="ff-fade-in fixed inset-0 z-[80] bg-[rgba(20,10,0,0.55)]" role="dialog" aria-modal="true" onClick={() => setSheet(null)}>
          <div className="ff-sheet-in ff-scroll absolute right-0 top-0 h-full w-[min(480px,100%)] overflow-y-auto bg-[var(--bg)] p-5 pb-10" onClick={(e) => e.stopPropagation()}>
            {sheet.kind === "product" && (
              <ProductSheet
                product={byId.get(sheet.id)}
                products={products}
                cart={cart}
                qtyBtn={qtyBtn}
                wishlist={wishlist}
                onWish={(id) => wishMutation.mutate(id)}
                isUnavailable={isUnavailable}
                isOOS={isOOS}
                onClose={() => setSheet(null)}
                onOpenProduct={(id) => setSheet({ kind: "product", id })}
                onOpenCart={() => setSheet({ kind: "cart" })}
                authorName={data.profile.name}
                settings={data.settings}
                onSubscribe={(p, frequency, qty) => subscribeMutation.mutate({ product: p, frequency, qty })}
              />
            )}
            {sheet.kind === "cart" && (
              <CartSheet
                entries={cartEntries}
                subtotal={cartSubtotal}
                qtyBtn={qtyBtn}
                profile={data.profile}
                addresses={data.addresses}
                area={area}
                settings={data.settings}
                onClose={() => setSheet(null)}
                onShop={() => setSheet(null)}
                showToast={showToast}
                onPlaced={(orderId) => { setCart({}); setSheet({ kind: "tracking", orderId }); }}
              />
            )}
            {sheet.kind === "notifications" && <NotificationsSheet onClose={() => setSheet(null)} />}
            {sheet.kind === "areas" && (
              <AreasSheet
                areas={areas} currentArea={area} addresses={data.addresses}
                geofenceKm={data.settings.geofence_km}
                onSelectArea={selectArea}
                onClose={() => setSheet(null)} showToast={showToast}
              />
            )}
            {sheet.kind === "profile" && (
              <ProfileSheet
                profile={data.profile} addresses={data.addresses}
                subscriptions={data.subscriptions}
                coinHistory={data.coin_history}
                wishlistProducts={products.filter((p) => wishlist.has(p.id))}
                orders={orders} qtyBtn={qtyBtn}
                onClose={() => setSheet(null)} showToast={showToast}
                onTrack={(id) => setSheet({ kind: "tracking", orderId: id })}
                onReorder={reorder}
                onOpenAreas={() => setSheet({ kind: "areas" })}
                onOpenAuth={() => setSheet({ kind: "auth" })}
                onOpenHelp={() => setSheet({ kind: "help" })}
                onOpenAdmin={() => setSheet({ kind: "admin" })}
                onLogout={() => custLogout.mutate()}
              />
            )}
            {sheet.kind === "staff" && <StaffSheet onClose={() => setSheet(null)} showToast={showToast} onTrack={(id) => setSheet({ kind: "tracking", orderId: id })} />}
            {sheet.kind === "admin" && <AdminSheet onClose={() => setSheet(null)} showToast={showToast} onTrack={(id) => setSheet({ kind: "tracking", orderId: id })} />}
            {sheet.kind === "auth" && (
              <AuthSheet
                onClose={() => setSheet(null)}
                showToast={showToast}
                onLoggedIn={handleLoggedIn}
              />
            )}
            {sheet.kind === "help" && (
              <HelpSheet
                onClose={() => setSheet(null)}
                showToast={showToast}
                profileName={data.profile.name}
                profilePhone={data.profile.phone}
              />
            )}
            {sheet.kind === "assistant" && (
              <AssistantSheet
                onClose={() => setSheet(null)}
                showToast={showToast}
                onAddItems={(items) => {
                  setCart((prev) => {
                    const next = { ...prev };
                    for (const it of items) {
                      const p = byId.get(it.product_id);
                      if (!p) continue;
                      next[it.product_id] = Math.min(p.stock, (next[it.product_id] ?? 0) + it.qty);
                    }
                    return next;
                  });
                }}
                onOpenCart={() => setSheet({ kind: "cart" })}
              />
            )}
            {sheet.kind === "bill" && (
              <BillSheet orderId={sheet.orderId} onClose={() => setSheet(null)} showToast={showToast} />
            )}
            {sheet.kind === "tracking" && (
              <TrackingSheet
                orderId={sheet.orderId}
                geofenceKm={data.settings.geofence_km}
                onClose={() => setSheet(null)}
                showToast={showToast}
                onReorder={reorder}
                onBill={(id) => setSheet({ kind: "bill", orderId: id })}
                chat={chatByOrder[sheet.orderId] ?? []}
                chatOpen={trackingChatFor === sheet.orderId}
                setChatOpen={(open) => setTrackingChatFor(open ? sheet.orderId : null)}
                onSendChat={(text) => {
                  const oid = sheet.orderId;
                  setChatByOrder((prev) => ({ ...prev, [oid]: [...(prev[oid] ?? []), { from: "me" as const, text }] }));
                  setTimeout(() => {
                    setChatByOrder((prev) => ({ ...prev, [oid]: [...(prev[oid] ?? []), { from: "rider" as const, text: "Ji sir/ma'am, main raste me hu — bas 2-3 minute me pahunch raha hu! 🛵" }] }));
                  }, 1200);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* Product detail sheet                                                */
/* ================================================================== */

function SheetHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-tight">{title}</h2>
      <button type="button" aria-label="Band karo" onClick={onClose}
        className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-lg">✕</button>
    </div>
  );
}

function ProductSheet(props: {
  product: Product | undefined;
  products: Product[];
  cart: Record<number, number>;
  qtyBtn: (p: Product) => React.ReactNode;
  wishlist: Set<number>;
  onWish: (id: number) => void;
  isUnavailable: (p: Product) => boolean;
  isOOS: (p: Product) => boolean;
  onClose: () => void;
  onOpenProduct: (id: number) => void;
  onOpenCart: () => void;
  authorName: string;
  settings: Bootstrap["settings"];
  onSubscribe: (p: Product, frequency: "daily" | "weekly", qty: number) => void;
}) {
  const p = props.product;
  const [freq, setFreq] = useState<"daily" | "weekly">("daily");
  const [subQty, setSubQty] = useState(1);
  const queryClient = useQueryClient();
  const reviewsQ = useQuery({
    queryKey: ["reviews", p?.id],
    queryFn: () => api.getProductReviews({ product_id: p?.id ?? 0 }),
    enabled: !!p,
  });
  const [revStars, setRevStars] = useState(5);
  const [revText, setRevText] = useState("");
  const [revMsg, setRevMsg] = useState("");
  const addReview = useMutation({
    mutationFn: async () => await api.addReview({ product_id: p?.id ?? 0, author: props.authorName, rating: revStars, text: revText.trim() }),
    onSuccess: (res) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["reviews", p?.id] });
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        setRevText("");
        setRevMsg("✅ Review save ho gaya — shukriya!");
      } else setRevMsg("⚠ " + res.error);
    },
    onError: (e) => setRevMsg("⚠ " + (e instanceof Error ? e.message : "Review save nahi hua")),
  });
  if (!p) return <SheetHead title="Product nahi mila" onClose={props.onClose} />;
  const rel = props.products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 3);
  return (
    <div>
      <SheetHead title="" onClose={props.onClose} />
      <div className="relative mt-1 grid h-[210px] place-items-center overflow-hidden rounded-[18px]" style={{ background: p.bg }}>
        <PImg p={p} alt={`${p.name} ki asli photo`} className="absolute inset-0 h-full w-full object-cover" />
        {p.off > 0 && <span className="absolute left-2.5 top-2.5 rounded-md bg-[var(--accent)] px-1.5 py-1 text-[11px] font-black text-white">{p.off}% OFF</span>}
        <button type="button" aria-label={`${p.name} wishlist`} onClick={() => props.onWish(p.id)}
          className={`absolute right-2 top-2 z-[2] grid h-[38px] w-[38px] place-items-center rounded-full border text-[17px] ${props.wishlist.has(p.id) ? "border-[#FFB59A] bg-[#FFE8E0]" : "border-[var(--border)] bg-white"}`}>
          {props.wishlist.has(p.id) ? "❤️" : "🤍"}
        </button>
      </div>
      <span className="mt-3 inline-block rounded-full bg-[#FFF1E6] px-2.5 py-1 text-xs font-extrabold text-[#B34700]">
        ★ {p.rating} rating · ⏱ 8 min delivery · {p.brand} · {p.source === "dark" ? "Fatafat Dark Store" : `Partner: ${p.vendor}`} · {props.isOOS(p) ? "Out of Stock" : props.isUnavailable(p) ? "Is area me nahi" : `Stock: ${p.stock}`}
      </span>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-[26px] font-bold leading-tight">{p.name}</h2>
      <p className="text-[var(--dim)]">{p.weight} · {p.hi} · {CATS.find((c) => c.id === p.category)?.name}</p>
      <p className="mt-2 leading-relaxed">{p.description}</p>
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex justify-between py-1 text-sm"><span>Price</span><b>{money(p.price)} {p.mrp > p.price && <s className="text-[var(--dim)]">{money(p.mrp)}</s>}</b></div>
        <div className="flex justify-between py-1 text-sm"><span>Delivery</span><span>{money(props.settings.free_threshold)}+ par <span className="font-black text-[var(--green)]">FREE</span>, warna {money(props.settings.delivery_charge)}</span></div>
        <div className="flex justify-between py-1 text-sm"><span>Live stock (DB)</span><b>{p.stock} units</b></div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <b className="text-lg">Quantity chuno:</b>
        {props.qtyBtn(p)}
      </div>
      <button type="button" onClick={props.onOpenCart} className="mt-4 w-full rounded-[14px] bg-[var(--accent)] py-3.5 text-base font-black text-white">Cart Dekho &amp; Order Karo →</button>

      <div className="mt-4 rounded-2xl border-[1.5px] border-[#FFD9A8] bg-[#FFFBF2] p-4">
        <b className="block font-[family-name:var(--font-display)] text-lg">🔄 Subscription — Apne Aap Aata Rahe</b>
        <p className="mt-0.5 text-[13px] text-[var(--dim)]">Roz subah ya har hafte ye item bina order kiye pahunchta rahega. Plan database me save hota hai — Profile → My Subscriptions se kabhi bhi pause/cancel kar sakte ho.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {([["daily", "☀️ Roz (Daily)"], ["weekly", "📅 Har Hafte (Weekly)"]] as const).map(([f, label]) => (
            <button key={f} type="button" aria-pressed={freq === f} onClick={() => setFreq(f)}
              className={`rounded-full border-[1.5px] px-3 py-2 text-[13px] font-extrabold ${freq === f ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>
              {label}
            </button>
          ))}
          <div className="flex items-center overflow-hidden rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--surface)]">
            <button type="button" aria-label="Subscription quantity kam karo" onClick={() => setSubQty((q) => Math.max(1, q - 1))} className="w-9 text-lg font-black">−</button>
            <span className="min-w-[28px] text-center font-black" aria-label={`Subscription quantity ${subQty}`}>{subQty}</span>
            <button type="button" aria-label="Subscription quantity badhao" onClick={() => setSubQty((q) => Math.min(10, q + 1))} className="w-9 text-lg font-black">+</button>
          </div>
        </div>
        <button type="button" disabled={props.isOOS(p) || props.isUnavailable(p)}
          onClick={() => props.onSubscribe(p, freq, subQty)}
          className="mt-3 w-full rounded-[14px] bg-[#1E140C] py-3 font-black text-white disabled:opacity-50">
          🔄 Subscribe Karo — {freq === "daily" ? "Roz" : "Har Hafte"} {subQty} × {money(p.price)} = {money(p.price * subQty)}
        </button>
        {(props.isOOS(p) || props.isUnavailable(p)) && <p className="mt-1.5 text-xs font-bold text-[#B42318]">Ye item abhi available nahi hai, isliye subscription nahi banegi.</p>}
      </div>
      <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <b className="block font-[family-name:var(--font-display)] text-lg">⭐ Rating &amp; Reviews</b>
        <p className="mt-0.5 text-[13px] text-[var(--dim)]">
          {reviewsQ.data && reviewsQ.data.count > 0
            ? <>Asli customers ka average: <b className="text-[var(--text)]">{reviewsQ.data.average} ★</b> ({reviewsQ.data.count} reviews) — product card par yahi average dikhta hai.</>
            : "Abhi is product par koi review nahi — pehle tum likho! Review aate hi card ka average usi se banta hai."}
        </p>
        {reviewsQ.data?.reviews.map((r) => (
          <div key={r.id} className="mt-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
            <b className="flex justify-between text-sm"><span>{r.author}</span><span className="text-[var(--green)]">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span></b>
            <p className="mt-0.5 text-sm leading-relaxed">{r.text}</p>
            <span className="text-xs text-[var(--dim)]">{escTime(r.created_at)}</span>
          </div>
        ))}
        <div className="mt-3 flex gap-1.5" role="radiogroup" aria-label="Apni rating chuno">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" role="radio" aria-checked={revStars === s} aria-label={`${s} star`} onClick={() => setRevStars(s)}
              className={`grid h-10 w-10 place-items-center rounded-full border-[1.5px] text-lg ${revStars >= s ? "border-[var(--accent)] bg-[#FFF1E6]" : "border-[var(--border)] bg-[var(--surface)] opacity-50"}`}>⭐</button>
          ))}
        </div>
        <label className="sr-only" htmlFor="revText">Apna review likho</label>
        <input id="revText" {...FIELDS.addReview.text} value={revText} onChange={(e) => setRevText(e.target.value)} placeholder="Apna review likho — quality kaisi lagi?" className="mt-2 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
        {revMsg && <p className="mt-1.5 text-[13px] font-bold">{revMsg}</p>}
        <button type="button" disabled={addReview.isPending}
          onClick={() => { if (revText.trim().length < 3) { setRevMsg("⚠ Review me kam se kam 3 akshar likho"); return; } addReview.mutate(); }}
          className="mt-2.5 w-full rounded-[14px] bg-[#1E140C] py-3 font-black text-white disabled:opacity-60">⭐ Review Post Karo</button>
      </div>
      {rel.length > 0 && (
        <>
          <h3 className="mb-1 mt-5 font-[family-name:var(--font-display)] text-lg font-bold">Iske saath ye bhi chalta hai</h3>
          {rel.map((r) => (
            <div key={r.id} className="mt-2.5 flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3">
              <PImg p={r} alt="" className="h-[52px] w-[52px] shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <b className="block truncate text-sm">{r.name}</b>
                <div className="text-xs text-[var(--dim)]">{r.weight} · {money(r.price)}</div>
              </div>
              {props.qtyBtn(r)}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/* Cart + checkout sheet (sticky Place Order bar)                      */
/* ================================================================== */

function CartSheet(props: {
  entries: { product: Product; qty: number }[];
  subtotal: number;
  qtyBtn: (p: Product) => React.ReactNode;
  profile: Bootstrap["profile"];
  addresses: Bootstrap["addresses"];
  area: Area | undefined;
  settings: Bootstrap["settings"];
  onClose: () => void;
  onShop: () => void;
  showToast: (m: string) => void;
  onPlaced: (orderId: string) => void;
}) {
  const queryClient = useQueryClient();
  const activeAddr = props.addresses.find((a) => a.is_active) ?? props.addresses[0];
  const [name, setName] = useState(props.profile.name);
  const [phone, setPhone] = useState(props.profile.phone);
  const [addrText, setAddrText] = useState(activeAddr?.text ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [payMethod, setPayMethod] = useState<"cod" | "upi" | "card" | "wallet">("cod");
  const [upiApp, setUpiApp] = useState("GPay");
  const [upiId, setUpiId] = useState("");
  const [walletApp, setWalletApp] = useState("Paytm Wallet");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [instructions, setInstructions] = useState<Set<string>>(new Set(["Gate pe rakh dena"]));
  const [customInstr, setCustomInstr] = useState("");
  const [useCoins, setUseCoins] = useState(false);
  const [slot, setSlot] = useState(DELIVERY_SLOTS[0] ?? "Abhi — 8 minutes me");
  const [isGift, setIsGift] = useState(false);
  const [giftName, setGiftName] = useState("");
  const [giftPhone, setGiftPhone] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [placeError, setPlaceError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const discount = applied?.discount ?? 0;
  const deliveryFee = props.subtotal === 0 || props.subtotal >= props.settings.free_threshold ? 0 : props.settings.delivery_charge;
  const payableBeforeCoins = Math.max(0, props.subtotal - discount) + (props.subtotal === 0 ? 0 : deliveryFee);
  const walletCoins = props.profile.coins;
  const coinsToUse = useCoins ? Math.min(walletCoins, payableBeforeCoins) : 0;
  const grand = payableBeforeCoins - coinsToUse;
  const earnPreview = Math.floor(grand * 0.05);
  const freeLeft = Math.max(0, props.settings.free_threshold - props.subtotal);
  const areaBlocked = props.area ? !props.area.serviceable : false;

  const couponMutation = useMutation({
    mutationFn: async () => await api.validateCoupon({ code: couponInput.trim(), subtotal: props.subtotal }),
    onSuccess: (res) => {
      if (res.ok) {
        setApplied({ code: res.code, discount: res.discount, label: res.label });
        setCouponMsg("✅ " + res.message);
      } else {
        setApplied(null);
        setCouponMsg("⚠ " + res.message);
      }
    },
    onError: (e) => setCouponMsg("⚠ " + (e instanceof Error ? e.message : "Coupon check nahi hua")),
  });

  const placeMutation = useMutation({
    mutationFn: async () => {
      const instrText = [...instructions, customInstr.trim()].filter(Boolean).join("; ");
      const payDetail =
        payMethod === "upi" ? `${upiApp}${upiId ? ` · ${upiId}` : ""}` :
        payMethod === "card" ? `Card ···· ${cardNum.replace(/\D/g, "").slice(-4)}` :
        payMethod === "wallet" ? walletApp : "Cash on Delivery";
      return await api.placeOrder({
        items: props.entries.map((e) => ({ product_id: e.product.id, qty: e.qty })),
        customer_name: name.trim(),
        phone: phone.trim(),
        address_label: activeAddr?.label ?? "Home",
        address_text: addrText.trim(),
        area_id: props.area?.id ?? "sec62",
        coupon_code: applied?.code ?? "",
        use_coins: useCoins,
        payment_method: payMethod,
        payment_detail: payDetail,
        instructions: instrText,
        delivery_slot: slot,
        is_gift: isGift,
        gift_name: giftName.trim(),
        gift_phone: giftPhone.trim(),
        gift_note: giftNote.trim(),
      });
    },
    onSuccess: (res) => {
      if (res.ok && res.order) {
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        void queryClient.invalidateQueries({ queryKey: ["staff"] });
        props.showToast(`🎉 Order ${res.order.id} place ho gaya!${res.order.coins_earned > 0 ? ` ${res.order.coins_earned} coins cashback mile 🪙` : ""} Stock DB me update ho gaya.`);
        props.onPlaced(res.order.id);
      } else {
        setPlaceError(res.error || "Order place nahi hua — phir try karo.");
        props.showToast(res.error || "Order place nahi hua");
      }
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Order place nahi hua — phir try karo.";
      setPlaceError(msg);
      props.showToast(msg);
    },
  });

  const validateAndPlace = () => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Naam kam se kam 2 akshar ka likho";
    const digits = phone.replace(/\D/g, "");
    const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
    if (!/^[6-9]\d{9}$/.test(local)) errs.phone = "Sahi 10-digit mobile number likho (+91 wala bhi chalega)";
    if (addrText.trim().length < 8) errs.address = "Poora address likho (kam se kam 8 akshar)";
    if (payMethod === "upi" && upiId && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) errs.upi = "UPI ID aisi hoti hai: naam@okbank";
    if (payMethod === "card") {
      if (cardNum.replace(/\D/g, "").length < 16) errs.card = "16-digit card number likho";
      if (!/^\d{2}\/\d{2}$/.test(cardExp.trim())) errs.cardExp = "Expiry MM/YY format me likho";
      if (cardCvv.replace(/\D/g, "").length < 3) errs.cardCvv = "3-digit CVV likho";
    }
    if (isGift) {
      if (giftName.trim().length < 2) errs.giftName = "Gift kise bhej rahe ho — uska naam likho";
      const gd = giftPhone.replace(/\D/g, "");
      const glocal = gd.length === 12 && gd.startsWith("91") ? gd.slice(2) : gd.length === 11 && gd.startsWith("0") ? gd.slice(1) : gd;
      if (!/^[6-9]\d{9}$/.test(glocal)) errs.giftPhone = "Gift pane wale ka sahi 10-digit number likho";
    }
    setErrors(errs);
    setPlaceError("");
    const firstKey = Object.keys(errs)[0];
    if (firstKey) {
      props.showToast("⚠ " + (errs[firstKey] ?? "Details check karo"));
      setTimeout(() => {
        const el = formRef.current?.querySelector(`[data-field="${firstKey}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLInputElement | null)?.focus?.();
      }, 50);
      return;
    }
    if (areaBlocked) {
      setPlaceError(`⚠ ${props.area?.name} ${props.settings.geofence_km} km radius ke bahar hai — pehle koi paas wala area chuno.`);
      return;
    }
    placeMutation.mutate();
  };

  const fieldCls = (k: string) =>
    `mt-2 w-full rounded-xl border-[1.5px] bg-[var(--surface)] p-3 text-[15px] ${errors[k] ? "border-[#D92D20] bg-[#FFF3F1]" : "border-[var(--border)]"}`;
  const errText = (k: string) => errors[k] ? <p className="mt-1 text-xs font-bold text-[#D92D20]">{errors[k]}</p> : null;

  return (
    <div ref={formRef}>
      <SheetHead title="🛒 Tumhara Cart" onClose={props.onClose} />
      {props.entries.length === 0 ? (
        <div className="mt-6 text-center">
          <div className="text-6xl">🛒</div>
          <p className="mt-3 font-bold">Cart khaali hai</p>
          <p className="text-sm text-[var(--dim)]">Kuch add karo — doodh, bread, chips… sab 8 minute me!</p>
          <button type="button" onClick={props.onShop} className="mt-4 w-full rounded-[14px] bg-[var(--accent)] py-3.5 font-black text-white">Shopping Shuru Karo →</button>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--dim)]">⏱ Delivery: <b className="text-[var(--text)]">{props.area?.eta ?? "8 min"}</b> · {props.area?.store_name}</p>
          {areaBlocked && (
            <div className="mt-3 rounded-[14px] border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] p-3 text-sm font-bold text-[#7A271A]">
              ⚠ {props.area?.name} {props.settings.geofence_km} km geofence ke bahar hai ({props.area?.dist_km} km) — yaha delivery nahi hogi. Upar se "Area Badlo" karke paas wala area chuno.
            </div>
          )}
          {props.entries.map(({ product: p, qty }) => (
            <div key={p.id} className="mt-2.5 flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3">
              <PImg p={p} alt="" className="h-[52px] w-[52px] shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <b className="block truncate text-sm">{p.name}</b>
                <div className="text-xs text-[var(--dim)]">{p.weight} · {money(p.price)} · Stock bacha: {p.stock}</div>
              </div>
              <b className="text-sm">{money(p.price * qty)}</b>
              {props.qtyBtn(p)}
            </div>
          ))}

          {/* Coupon */}
          <div className="mt-4 flex gap-2">
            <label className="sr-only" htmlFor="couponInput">Coupon code</label>
            <input id="couponInput" {...FIELDS.validateCoupon.code} value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Coupon code — FATA75 / FIRST50"
              className="min-w-0 flex-1 rounded-xl border-[1.5px] border-dashed border-[#FF9A5C] bg-[var(--surface)] p-3 font-extrabold uppercase" />
            <button type="button" onClick={() => { if (couponInput.trim()) couponMutation.mutate(); else setCouponMsg("Pehle coupon code likho"); }}
              className="rounded-xl bg-[#1E140C] px-4 font-black text-white">Apply</button>
          </div>
          {couponMsg && <p className="mt-1.5 text-[13px] font-bold">{couponMsg}</p>}
          {applied && (
            <button type="button" onClick={() => { setApplied(null); setCouponMsg("Coupon hata diya."); }}
              className="mt-1 text-[13px] font-bold text-[#B42318]">✕ {applied.code} hatao</button>
          )}

          {/* Fatafat Coins wallet */}
          <div className="mt-4 rounded-2xl border-[1.5px] border-[#F2C94C] bg-[#FFF9E6] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <b className="block">🪙 Fatafat Coins Wallet</b>
                <span className="text-[13px] text-[var(--dim)]">Balance: <b className="text-[var(--text)]">{walletCoins} coins</b> (1 coin = ₹1) · Har order par 5% coins wapas milte hain</span>
              </div>
              <button type="button" aria-pressed={useCoins} disabled={walletCoins <= 0}
                onClick={() => setUseCoins((v) => !v)}
                className={`shrink-0 rounded-full px-4 py-2.5 font-black disabled:opacity-50 ${useCoins ? "bg-[var(--green)] text-white" : "border-[1.5px] border-[var(--border)] bg-[var(--surface)]"}`}>
                {useCoins ? "✓ Coins Lage Hain" : "Coins Use Karo"}
              </button>
            </div>
            {walletCoins <= 0 && <p className="mt-1.5 text-xs text-[var(--dim)]">Abhi coins nahi hain — pehla order karte hi 5% coins milenge, ya Profile me dost ka referral code lagao (₹50 free coins!).</p>}
            {useCoins && coinsToUse > 0 && <p className="mt-1.5 text-[13px] font-bold text-[var(--green)]">Is bill me {coinsToUse} coins = {money(coinsToUse)} kam ho jayenge 🎉</p>}
          </div>

          {/* Bill */}
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex justify-between py-1.5 text-sm"><span>Item total</span><span>{money(props.subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between py-1.5 text-sm font-bold text-[var(--green)]"><span>Coupon {applied?.code} discount</span><span>− {money(discount)}</span></div>}
            {coinsToUse > 0 && <div className="flex justify-between py-1.5 text-sm font-bold text-[var(--green)]"><span>🪙 Fatafat Coins ({coinsToUse})</span><span>− {money(coinsToUse)}</span></div>}
            <div className="flex justify-between py-1.5 text-sm">
              <span>Delivery</span>
              {deliveryFee === 0 ? <span className="font-black text-[var(--green)]">FREE</span> : <span>{money(deliveryFee)}</span>}
            </div>
            {freeLeft > 0 && <p className="py-1 text-[13px] font-bold text-[var(--accent-dark)]">Bas {money(freeLeft)} aur add karo — delivery FREE ho jayegi! 🎉</p>}
            {earnPreview > 0 && <p className="py-1 text-[13px] font-bold text-[#8A6D00]">🪙 Is order par tumhe {earnPreview} coins cashback milenge (5%)!</p>}
            <div className="mt-1.5 flex justify-between border-t border-dashed border-[var(--border)] pt-3 text-base font-black"><span>Total dena hai</span><span>{money(grand)}</span></div>
          </div>

          {/* Checkout form */}
          <h3 className="mb-0 mt-5 font-[family-name:var(--font-display)] text-lg font-bold">📋 Delivery details</h3>
          <label className="mt-2 block text-[13px] font-bold" htmlFor="coName">Tumhara naam</label>
          <input id="coName" {...FIELDS.placeOrder.customer_name} data-field="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Naam likho" className={fieldCls("name")} />
          {errText("name")}
          <label className="mt-3 block text-[13px] font-bold" htmlFor="coPhone">Mobile number</label>
          <input id="coPhone" {...FIELDS.placeOrder.phone} data-field="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile (+91 bhi chalega)" inputMode="tel" className={fieldCls("phone")} />
          {errText("phone")}
          <label className="mt-3 block text-[13px] font-bold" htmlFor="coAddr">Poora address</label>
          <input id="coAddr" {...FIELDS.placeOrder.address_text} data-field="address" value={addrText} onChange={(e) => setAddrText(e.target.value)} placeholder="Flat, gali, landmark ke saath" className={fieldCls("address")} />
          {errText("address")}

          {/* Delivery instructions */}
          <h3 className="mb-0 mt-5 font-[family-name:var(--font-display)] text-lg font-bold">🔔 Delivery instructions</h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {INSTRUCTION_PRESETS.map((ins) => (
              <button key={ins} type="button" aria-pressed={instructions.has(ins)}
                onClick={() => setInstructions((prev) => { const n = new Set(prev); if (n.has(ins)) n.delete(ins); else n.add(ins); return n; })}
                className={`rounded-full border-[1.5px] px-3 py-2 text-[13px] font-extrabold ${instructions.has(ins) ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>
                {ins}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="customInstr">Apni instruction likho</label>
          <input id="customInstr" {...FIELDS.placeOrder.instructions} value={customInstr} onChange={(e) => setCustomInstr(e.target.value)} placeholder="Ya apni instruction likho…" className="mt-2 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />

          {/* Delivery slot */}
          <h3 className="mb-0 mt-5 font-[family-name:var(--font-display)] text-lg font-bold">🕐 Delivery kab chahiye?</h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {DELIVERY_SLOTS.map((s) => (
              <button key={s} type="button" aria-pressed={slot === s} onClick={() => setSlot(s)}
                className={`rounded-full border-[1.5px] px-3 py-2 text-[13px] font-extrabold ${slot === s ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>
                {s}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-[var(--dim)]">Slot order par save hota hai — tracking aur staff panel dono me dikhega.</p>

          {/* Gift order */}
          <div className="mt-5 rounded-2xl border-[1.5px] border-[#F3C6DA] bg-[#FDF2F8] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <b className="block">🎁 Ye Gift Order Hai?</b>
                <span className="text-[13px] text-[var(--dim)]">Kisi aur ke liye bhej rahe ho to on karo — unka naam, number aur gift note order par lagega.</span>
              </div>
              <button type="button" aria-pressed={isGift} onClick={() => setIsGift((v) => !v)}
                className={`shrink-0 rounded-full px-4 py-2.5 font-black ${isGift ? "bg-[#C2185B] text-white" : "border-[1.5px] border-[var(--border)] bg-[var(--surface)]"}`}>
                {isGift ? "✓ Gift Mode On" : "Gift Mode"}
              </button>
            </div>
            {isGift && (
              <div>
                <label className="mt-3 block text-[13px] font-bold" htmlFor="giftName">Gift kise milega — naam</label>
                <input id="giftName" {...FIELDS.placeOrder.gift_name} data-field="giftName" value={giftName} onChange={(e) => setGiftName(e.target.value)} placeholder="Jaise: Mummy / Rahul" className={fieldCls("giftName")} />
                {errText("giftName")}
                <label className="mt-3 block text-[13px] font-bold" htmlFor="giftPhone">Unka mobile number</label>
                <input id="giftPhone" {...FIELDS.placeOrder.gift_phone} data-field="giftPhone" value={giftPhone} onChange={(e) => setGiftPhone(e.target.value)} placeholder="10-digit mobile" inputMode="tel" className={fieldCls("giftPhone")} />
                {errText("giftPhone")}
                <label className="mt-3 block text-[13px] font-bold" htmlFor="giftNote">Gift note (card par likha jayega)</label>
                <input id="giftNote" {...FIELDS.placeOrder.gift_note} value={giftNote} onChange={(e) => setGiftNote(e.target.value)} placeholder="Jaise: Happy Birthday! 🎂" className="mt-2 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
              </div>
            )}
          </div>

          {/* Payment */}
          <h3 className="mb-0 mt-5 font-[family-name:var(--font-display)] text-lg font-bold">💳 Payment kaise karoge?</h3>
          <p className="text-xs text-[var(--dim)]">Demo mode: koi asli paisa nahi katega. Asli gateway ke liye apna provider account lagega.</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {([
              ["cod", "💵 Cash on Delivery", "Darwaze par paise do"],
              ["upi", "📱 UPI", "GPay / PhonePe / Paytm"],
              ["card", "💳 Card", "Debit / Credit card"],
              ["wallet", "👛 Wallet", "Paytm / Amazon Pay"],
            ] as const).map(([m, b, s]) => (
              <button key={m} type="button" onClick={() => setPayMethod(m)}
                className={`rounded-[14px] border-[1.5px] p-3 text-left ${payMethod === m ? "border-[var(--accent)] bg-[#FFF1E6]" : "border-[var(--border)] bg-[var(--surface)]"}`}>
                <b className="block">{b}</b><span className="text-xs text-[var(--dim)]">{s}</span>
              </button>
            ))}
          </div>
          {payMethod === "upi" && (
            <div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {UPI_APPS.map((a) => (
                  <button key={a} type="button" onClick={() => setUpiApp(a)}
                    className={`rounded-full border-[1.5px] px-3 py-2 font-extrabold ${upiApp === a ? "border-[#1E140C] bg-[#1E140C] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>{a}</button>
                ))}
              </div>
              <label className="sr-only" htmlFor="upiId">UPI ID (optional)</label>
              <input id="upiId" {...FIELDS.placeOrder.payment_detail} data-field="upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="UPI ID (optional) — jaise naam@okhdfc" className={fieldCls("upi")} />
              {errText("upi")}
            </div>
          )}
          {payMethod === "card" && (
            <div>
              <label className="sr-only" htmlFor="cardNum">Card number</label>
              <input id="cardNum" data-field="card" value={cardNum} onChange={(e) => setCardNum(e.target.value)} placeholder="Card number (16 digit)" inputMode="numeric" className={fieldCls("card")} />
              {errText("card")}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="sr-only" htmlFor="cardExp">Card expiry MM/YY</label>
                  <input id="cardExp" data-field="cardExp" value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM/YY" className={fieldCls("cardExp")} />
                  {errText("cardExp")}
                </div>
                <div className="flex-1">
                  <label className="sr-only" htmlFor="cardCvv">Card CVV</label>
                  <input id="cardCvv" data-field="cardCvv" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="CVV" inputMode="numeric" type="password" className={fieldCls("cardCvv")} />
                  {errText("cardCvv")}
                </div>
              </div>
            </div>
          )}
          {payMethod === "wallet" && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {WALLETS.map((w) => (
                <button key={w} type="button" onClick={() => setWalletApp(w)}
                  className={`rounded-full border-[1.5px] px-3 py-2 font-extrabold ${walletApp === w ? "border-[#1E140C] bg-[#1E140C] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>{w}</button>
              ))}
            </div>
          )}

          {placeError && <div className="mt-4 rounded-[14px] border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] p-3 text-sm font-bold text-[#7A271A]">{placeError}</div>}

          {/* Sticky place-order bar */}
          <div className="sticky bottom-0 z-[3] mt-5 bg-[var(--bg)] pb-1.5 pt-3 shadow-[0_-12px_22px_-14px_rgba(30,20,12,0.45)]">
            <button type="button" onClick={validateAndPlace} disabled={placeMutation.isPending}
              className="w-full rounded-[14px] bg-[var(--accent)] py-4 text-base font-black text-white shadow-lg disabled:opacity-60">
              {placeMutation.isPending ? "Order Place Ho Raha Hai…" : `✅ Order Place Karo · ${money(grand)}`}
            </button>
            <p className="mt-1.5 text-center text-xs text-[var(--dim)]">Order dabate hi stock database me kam ho jayega aur staff ko packing alert jayega.</p>
          </div>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/* Notifications sheet (customer / staff / vendor)                     */
/* ================================================================== */

function NotifList({ items, emptyText }: { items: Notif[]; emptyText: string }) {
  if (items.length === 0) return <p className="mt-2 text-sm text-[var(--dim)]">{emptyText}</p>;
  return (
    <>
      {items.map((n) => (
        <div key={n.id} className={`mt-2.5 rounded-[14px] border p-3 text-sm ${!n.is_read && n.audience === "customer" ? "border-[#FF9A5C] bg-[#FFF7EE]" : "border-[var(--border)] bg-[var(--surface)]"}`}>
          <b>{n.title}</b>
          <div className="mt-0.5 text-[var(--dim)]">{n.message}</div>
          <div className="mt-1 text-xs text-[var(--dim)]">{escTime(n.created_at)}</div>
        </div>
      ))}
    </>
  );
}

function NotificationsSheet({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"customer" | "staff" | "vendor">("customer");
  const notifs = useQuery({
    queryKey: ["notifications", "all"],
    queryFn: () => api.listNotifications({ audience: "all", limit: 60 }),
    refetchInterval: 6000,
  });
  const markRead = useMutation({
    mutationFn: async () => await api.markNotificationsRead({}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  useEffect(() => { markRead.mutate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const all = notifs.data?.notifications ?? [];
  const byAud = (a: string) => all.filter((n) => n.audience === a);
  return (
    <div>
      <SheetHead title="🔔 Notifications" onClose={onClose} />
      <p className="text-sm text-[var(--dim)]">Ye saari notifications server ki database se aa rahi hain — order status ki live updates yahi milti hain. (Asli phone push ke liye Firebase lagega.)</p>
      <div className="mt-3 flex gap-2">
        {([["customer", "🙋 Mere Updates"], ["staff", "🏪 Staff Alerts"], ["vendor", "⚠️ Vendor Alerts"]] as const).map(([t, label]) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`rounded-full border-[1.5px] px-3 py-2 text-[13px] font-extrabold ${tab === t ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>
            {label} ({byAud(t).length})
          </button>
        ))}
      </div>
      {notifs.isPending ? <p className="mt-4 text-sm text-[var(--dim)]">Load ho raha hai…</p> : (
        tab === "customer" ? <NotifList items={byAud("customer")} emptyText="Abhi koi notification nahi." />
        : tab === "staff" ? (
          <>
            <p className="mt-2 text-[13px] text-[var(--dim)]">Order aate hi staff ko yahi alert jata hai: "Order aaya hai, jaldi pack karo!"</p>
            <NotifList items={byAud("staff")} emptyText="Abhi staff alert nahi — pehla order place karke dekho." />
          </>
        ) : (
          <>
            <p className="mt-2 text-[13px] text-[var(--dim)]">Stock 5 ya usse kam hote hi vendor ko alert jata hai.</p>
            <NotifList items={byAud("vendor")} emptyText="Abhi koi low-stock alert nahi." />
          </>
        )
      )}
      <button type="button" onClick={onClose} className="mt-5 w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">Band Karo</button>
    </div>
  );
}

/* ================================================================== */
/* Areas sheet                                                         */
/* ================================================================== */

function AreasSheet(props: {
  areas: Area[];
  currentArea: Area | undefined;
  addresses: Bootstrap["addresses"];
  geofenceKm: number;
  onSelectArea: (a: Area) => void;
  onClose: () => void;
  showToast: (m: string) => void;
}) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [text, setText] = useState("");
  const addAddr = useMutation({
    mutationFn: async () => await api.addAddress({ label: label.trim(), text: text.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      props.showToast("Naya address save + select ho gaya ✓");
      setLabel(""); setText("");
    },
    onError: (e) => props.showToast(e instanceof Error ? e.message : "Address save nahi hua"),
  });
  const selectAddr = useMutation({
    mutationFn: async (id: number) => await api.selectAddress({ address_id: id }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["bootstrap"] }); props.showToast("Address badal gaya ✓"); },
    onError: (e) => props.showToast(e instanceof Error ? e.message : "Address select nahi hua"),
  });
  const ca = props.currentArea;
  return (
    <div>
      <SheetHead title="📍 Apna Area Chuno" onClose={props.onClose} />
      <p className="text-sm text-[var(--dim)]">Location-based discovery: area badalte hi store, ETA aur available samaan badal jata hai. Delivery radius <b>{props.geofenceKm} km</b> hai (Geofencing — admin settings se badalta hai). Selection database me save hoti hai.</p>
      {ca && (ca.serviceable ? (
        <div className="mt-3 rounded-[14px] border-[1.5px] border-[#A6D8AB] bg-[#EAF7EC] p-3 text-sm font-bold text-[#14532D]">✓ {ca.name} — {ca.store_name} se delivery hogi · Sirf {ca.dist_km} km door · ETA {ca.eta}</div>
      ) : (
        <div className="mt-3 rounded-[14px] border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] p-3 text-sm font-bold text-[#7A271A]">⚠ {ca.name} {props.geofenceKm} km radius ke bahar hai ({ca.dist_km} km) — yaha delivery nahi hogi. Paas wala area chuno.</div>
      ))}
      {props.areas.map((a) => (
        <button key={a.id} type="button" onClick={() => props.onSelectArea(a)}
          className={`mt-2.5 w-full rounded-[14px] border-[1.5px] p-3.5 text-left ${a.id === ca?.id ? "border-[var(--accent)] bg-[#FFF7EE]" : "border-[var(--border)] bg-[var(--surface)]"} ${!a.serviceable ? "opacity-75" : ""}`}>
          <b className="flex justify-between"><span>📍 {a.name}</span><span>{a.id === ca?.id ? "✓ Selected" : a.serviceable ? "Select karo" : "🚫 No Delivery"}</span></b>
          <span className="mt-1 block text-[13px] text-[var(--dim)]">{a.store_name} · {a.store_type} · {a.dist_km} km {a.serviceable ? `· ETA ${a.eta}` : `· ${props.geofenceKm} km radius ke bahar`}{a.unavailable_ids.length ? ` · ${a.unavailable_ids.length} items yaha nahi milte` : ""}</span>
        </button>
      ))}
      <h3 className="mb-0 mt-5 font-[family-name:var(--font-display)] text-lg font-bold">Saved Addresses</h3>
      {props.addresses.map((a) => (
        <button key={a.id} type="button" onClick={() => selectAddr.mutate(a.id)}
          className={`mt-2.5 w-full rounded-[14px] border-[1.5px] p-3.5 text-left ${a.is_active ? "border-[var(--accent)] bg-[#FFF7EE]" : "border-[var(--border)] bg-[var(--surface)]"}`}>
          <b className="flex justify-between"><span>🏠 {a.label}</span><span>{a.is_active ? "✓ Selected" : "Select karo"}</span></b>
          <span className="mt-1 block text-[13px] text-[var(--dim)]">{a.text}</span>
        </button>
      ))}
      <h3 className="mb-0 mt-5 font-[family-name:var(--font-display)] text-lg font-bold">Naya address jodo</h3>
      <label className="sr-only" htmlFor="newAddrLabel">Address label</label>
      <input id="newAddrLabel" {...FIELDS.addAddress.label} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label — jaise: Dost ka Ghar" className="mt-2 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
      <label className="sr-only" htmlFor="newAddrText">Poora address</label>
      <input id="newAddrText" {...FIELDS.addAddress.text} value={text} onChange={(e) => setText(e.target.value)} placeholder="Poora address likho" className="mt-2 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
      <button type="button" disabled={addAddr.isPending}
        onClick={() => {
          if (label.trim().length < 2 || text.trim().length < 8) { props.showToast("Label aur poora address sahi se likho"); return; }
          addAddr.mutate();
        }}
        className="mt-3 w-full rounded-[14px] bg-[var(--accent)] py-3.5 font-black text-white disabled:opacity-60">+ Address Save Karo</button>
    </div>
  );
}

/* ================================================================== */
/* Profile sheet                                                       */
/* ================================================================== */

function ProfileSheet(props: {
  profile: Bootstrap["profile"];
  addresses: Bootstrap["addresses"];
  subscriptions: Subscription[];
  coinHistory: CoinEntry[];
  wishlistProducts: Product[];
  orders: Order[];
  qtyBtn: (p: Product) => React.ReactNode;
  onClose: () => void;
  showToast: (m: string) => void;
  onTrack: (id: string) => void;
  onReorder: (o: Order) => void;
  onOpenAreas: () => void;
  onOpenAuth: () => void;
  onOpenHelp: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(props.profile.name);
  const [phone, setPhone] = useState(props.profile.phone);
  const [err, setErr] = useState("");
  const save = useMutation({
    mutationFn: async () => await api.updateProfile({ name: name.trim(), phone: phone.trim() }),
    onSuccess: (res) => {
      if (res.ok) { void queryClient.invalidateQueries({ queryKey: ["bootstrap"] }); props.showToast("Profile save ho gaya ✓"); setErr(""); }
      else setErr(res.error);
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Profile save nahi hua"),
  });
  const activeAddr = props.addresses.find((a) => a.is_active) ?? props.addresses[0];
  const [refInput, setRefInput] = useState("");
  const [refMsg, setRefMsg] = useState("");
  const applyRef = useMutation({
    mutationFn: async () => await api.applyReferralCode({ code: refInput.trim() }),
    onSuccess: (res) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        setRefMsg("🎉 Ho gaya! 50 coins (₹50) tumhare wallet me aa gaye — aur code wale dost ko bhi ₹50 credit mila.");
        setRefInput("");
      } else setRefMsg("⚠ " + res.error);
    },
    onError: (e) => setRefMsg("⚠ " + (e instanceof Error ? e.message : "Code nahi laga")),
  });
  const subStatus = useMutation({
    mutationFn: async (v: { id: number; status: "active" | "paused" | "cancelled" }) =>
      await api.setSubscriptionStatus({ subscription_id: v.id, status: v.status }),
    onSuccess: (res, v) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        props.showToast(v.status === "active" ? "Subscription phir shuru ho gayi ▶" : v.status === "paused" ? "Subscription pause ho gayi ⏸" : "Subscription cancel ho gayi");
      } else props.showToast(res.error || "Status change nahi hua");
    },
    onError: (e) => props.showToast(e instanceof Error ? e.message : "Status change nahi hua"),
  });
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(props.profile.referral_code);
      props.showToast("Referral code copy ho gaya 📋 — dost ko bhej do!");
    } catch {
      props.showToast(`Tumhara code: ${props.profile.referral_code} — ise note karke dost ko bhej do`);
    }
  };
  return (
    <div>
      <SheetHead title={`Namaste, ${props.profile.name} 👋`} onClose={props.onClose} />
      <p className="text-[var(--dim)]">📱 {props.profile.phone} · {activeAddr?.label ?? ""} · Profile database me save hai</p>

      {props.profile.is_guest ? (
        <div className="mt-4 rounded-2xl border-[1.5px] border-[#FFD9A8] bg-[#FFFBF2] p-4">
          <b className="block">👤 Tum Guest (Demo) Account par ho</b>
          <p className="mt-0.5 text-[13px] text-[var(--dim)]">Apna khud ka account banao ya login karo — phir tumhare orders, coins, subscriptions aur addresses sirf tumhare rahenge, kisi aur ke data se alag.</p>
          <button type="button" onClick={props.onOpenAuth} className="mt-3 w-full rounded-[14px] bg-[var(--accent)] py-3 font-black text-white">🔐 Login / Sign Up Karo</button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border-[1.5px] border-[#A6D8AB] bg-[#EAF7EC] p-4">
          <b className="block text-[#14532D]">✅ Logged in — {props.profile.name}</b>
          <p className="mt-0.5 text-[13px] text-[var(--dim)]">Ye sab data (orders, coins, subscriptions) sirf tumhare account ka hai. Kaam ho jaye to logout kar sakte ho — app wapas Guest account par chala jayega.</p>
          <button type="button" onClick={props.onLogout} className="mt-3 w-full rounded-[14px] border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] py-3 font-black text-[#B42318]">🚪 Logout Karo</button>
        </div>
      )}

      <h3 className="mb-0 mt-5 font-[family-name:var(--font-display)] text-lg font-bold">Profile badlo</h3>
      <label className="sr-only" htmlFor="profName">Tumhara naam</label>
      <input id="profName" {...FIELDS.updateProfile.name} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tumhara naam" className="mt-2 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
      <label className="sr-only" htmlFor="profPhone">Mobile number</label>
      <input id="profPhone" {...FIELDS.updateProfile.phone} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" inputMode="tel" className="mt-2 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
      {err && <p className="mt-1.5 text-[13px] font-bold text-[#B42318]">{err}</p>}
      <button type="button" disabled={save.isPending} onClick={() => {
        if (name.trim().length < 2) { setErr("Naam kam se kam 2 akshar ka likho"); return; }
        save.mutate();
      }} className="mt-3 w-full rounded-[14px] bg-[var(--accent)] py-3.5 font-black text-white disabled:opacity-60">Profile Save Karo</button>

      <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">🪙 Fatafat Coins Wallet</h3>
      <div className="mt-2 rounded-2xl border-[1.5px] border-[#F2C94C] bg-[#FFF9E6] p-4">
        <b className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[#8A6D00]">{props.profile.coins} coins</b>
        <p className="mt-0.5 text-[13px] text-[var(--dim)]">= {money(props.profile.coins)} ki value · 1 coin = ₹1 · Har order par bill ka 5% coins me wapas milta hai. Checkout me "Coins Use Karo" dabakar bill kam karo.</p>
      </div>
      {props.coinHistory.length > 0 && (
        <div className="mt-2">
          {props.coinHistory.slice(0, 8).map((c) => (
            <div key={c.id} className="mt-1.5 flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px]">
              <span className="min-w-0 flex-1">{c.note}<span className="block text-xs text-[var(--dim)]">{escTime(c.created_at)}</span></span>
              <b className={c.amount >= 0 ? "text-[var(--green)]" : "text-[#B42318]"}>{c.amount >= 0 ? "+" : ""}{c.amount} 🪙</b>
            </div>
          ))}
        </div>
      )}

      <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">🎁 Refer &amp; Earn — Dono Ko ₹50</h3>
      <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-[13px] text-[var(--dim)]">Apna code doston ko bhejo. Jab dost tumhara code lagayega, <b className="text-[var(--text)]">use bhi ₹50 ke coins aur tumhe bhi ₹50 credit</b> milega — server par track hota hai.</p>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="flex-1 rounded-xl border-[1.5px] border-dashed border-[#FF9A5C] bg-[#FFFBF6] px-3 py-3 text-center font-[family-name:var(--font-display)] text-lg font-extrabold tracking-wide">{props.profile.referral_code || "—"}</span>
          <button type="button" onClick={() => void copyCode()} className="rounded-xl bg-[#1E140C] px-4 py-3 font-black text-white">📋 Copy</button>
        </div>
        {props.profile.referred_by ? (
          <p className="mt-2.5 text-[13px] font-bold text-[var(--green)]">✓ Tumne dost ka code ({props.profile.referred_by}) use karke ₹50 bonus le liya hai.</p>
        ) : (
          <>
            <p className="mt-3 text-[13px] font-bold">Dost ka code mila hai? Yaha lagao — turant 50 coins:</p>
            <div className="mt-2 flex gap-2">
              <label className="sr-only" htmlFor="refCodeInput">Dost ka referral code</label>
              <input id="refCodeInput" {...FIELDS.applyReferralCode.code} value={refInput} onChange={(e) => setRefInput(e.target.value.toUpperCase())}
                placeholder="Jaise: FF-RAHUL-1234"
                className="min-w-0 flex-1 rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 font-extrabold uppercase" />
              <button type="button" disabled={applyRef.isPending}
                onClick={() => { if (refInput.trim().length >= 3) applyRef.mutate(); else setRefMsg("⚠ Pehle dost ka code likho"); }}
                className="rounded-xl bg-[var(--accent)] px-4 font-black text-white disabled:opacity-60">Lagao</button>
            </div>
            {refMsg && <p className="mt-1.5 text-[13px] font-bold">{refMsg}</p>}
          </>
        )}
      </div>

      <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">🔄 My Subscriptions ({props.subscriptions.filter((s) => s.status !== "cancelled").length})</h3>
      {props.subscriptions.length === 0 ? (
        <p className="mt-1.5 text-sm text-[var(--dim)]">Abhi koi subscription nahi. Kisi product (jaise doodh) ko kholo aur "Subscribe Karo" dabao — roz/har hafte apne aap aata rahega.</p>
      ) : props.subscriptions.map((s) => (
        <div key={s.id} className={`mt-2.5 rounded-[14px] border-[1.5px] p-3.5 ${s.status === "cancelled" ? "border-[var(--border)] bg-[var(--surface)] opacity-60" : "border-[#FFD9A8] bg-[#FFFBF2]"}`}>
          <b className="flex justify-between gap-2">
            <span className="min-w-0 truncate">{s.product_name}</span>
            <span className={s.status === "active" ? "text-[var(--green)]" : s.status === "paused" ? "text-[#B54708]" : "text-[#B42318]"}>
              {s.status === "active" ? "▶ Active" : s.status === "paused" ? "⏸ Paused" : "✕ Cancelled"}
            </span>
          </b>
          <div className="mt-0.5 text-[13px] text-[var(--dim)]">
            {s.frequency === "daily" ? "☀️ Roz subah" : "📅 Har hafte"} · {s.qty} × {s.weight} · {money(s.price * s.qty)}/delivery
          </div>
          {s.status !== "cancelled" && (
            <div className="mt-2.5 flex gap-2">
              {s.status === "active" ? (
                <button type="button" disabled={subStatus.isPending} onClick={() => subStatus.mutate({ id: s.id, status: "paused" })}
                  className="flex-1 rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-2.5 font-black disabled:opacity-60">⏸ Pause Karo</button>
              ) : (
                <button type="button" disabled={subStatus.isPending} onClick={() => subStatus.mutate({ id: s.id, status: "active" })}
                  className="flex-1 rounded-xl bg-[var(--green)] py-2.5 font-black text-white disabled:opacity-60">▶ Phir Shuru Karo</button>
              )}
              <button type="button" disabled={subStatus.isPending} onClick={() => subStatus.mutate({ id: s.id, status: "cancelled" })}
                className="flex-1 rounded-xl border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] py-2.5 font-black text-[#B42318] disabled:opacity-60">✕ Cancel Karo</button>
            </div>
          )}
        </div>
      ))}

      <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">❤️ Meri Wishlist ({props.wishlistProducts.length})</h3>
      {props.wishlistProducts.length === 0 ? <p className="mt-1.5 text-sm text-[var(--dim)]">Abhi wishlist khaali hai — kisi product par ❤️ dabao.</p> :
        props.wishlistProducts.map((p) => (
          <div key={p.id} className="mt-2.5 flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3">
            <PImg p={p} alt="" className="h-[52px] w-[52px] shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1"><b className="block truncate text-sm">{p.name}</b><div className="text-xs text-[var(--dim)]">{p.weight} · {money(p.price)}</div></div>
            {props.qtyBtn(p)}
          </div>
        ))}

      <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">📦 Mere Orders ({props.orders.length})</h3>
      {props.orders.length === 0 ? <p className="mt-1.5 text-sm text-[var(--dim)]">Abhi koi order nahi. Pehla order place karo!</p> :
        props.orders.map((o) => (
          <div key={o.id} className="mt-2.5">
            <button type="button" onClick={() => props.onTrack(o.id)} className="w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3.5 text-left">
              <b className="flex justify-between"><span>{o.id}</span><span className="text-[var(--accent-dark)]">{o.status_label}</span></b>
              <span className="mt-1 block text-[13px] text-[var(--dim)]">{o.items_count} items · {money(o.grand_total)} · {escTime(o.created_at)} · Details →</span>
            </button>
            <button type="button" onClick={() => props.onReorder(o)} className="mt-1.5 w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">🔁 Ek Click Re-Order — Wahi Samaan Cart Me Daalo</button>
          </div>
        ))}
      <button type="button" onClick={props.onOpenAreas} className="mt-5 w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">📍 Area / Address Badlo</button>
      <button type="button" onClick={props.onOpenHelp} className="mt-2.5 w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">❓ Help &amp; Support — Sawal / Problem Batao</button>
      <button type="button" onClick={props.onOpenAdmin} className="mt-2.5 w-full rounded-[14px] border-[1.5px] border-[#1E140C] bg-[#1E140C] py-3 font-black text-white">🔐 Admin Panel (Owner Login)</button>
      <button type="button" onClick={props.onClose} className="mt-2.5 w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">Shopping Jaari Rakho</button>
    </div>
  );
}

/* ================================================================== */
/* Staff panel sheet (dark-store operations, backed by the database)   */
/* ================================================================== */

function StaffSheet(props: { onClose: () => void; showToast: (m: string) => void; onTrack: (id: string) => void }) {
  const queryClient = useQueryClient();
  const staff = useQuery({
    queryKey: ["staff"],
    queryFn: () => api.getStaffSummary({}),
    refetchInterval: 6000,
  });
  const staffNotifs = useQuery({
    queryKey: ["notifications", "staffvendor"],
    queryFn: () => api.listNotifications({ audience: "all", limit: 60 }),
    refetchInterval: 6000,
  });
  const dash = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.getSalesDashboard({}),
    refetchInterval: 15000,
  });
  const vendorList = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.listVendors({}),
  });
  const vendorCoupons = useQuery({
    queryKey: ["vendorCoupons"],
    queryFn: () => api.listVendorCoupons({}),
  });
  const [vShop, setVShop] = useState("");
  const [vOwner, setVOwner] = useState("");
  const [vPhone, setVPhone] = useState("");
  const [vArea, setVArea] = useState("");
  const [vMsg, setVMsg] = useState("");
  const registerVendor = useMutation({
    mutationFn: async () => await api.registerVendor({ shop_name: vShop.trim(), owner_name: vOwner.trim(), phone: vPhone.trim(), area: vArea.trim() }),
    onSuccess: (res) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["vendors"] });
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        setVMsg("✅ Dukaan register ho gayi! Ab neeche se apne products aur coupons add karo.");
        setVShop(""); setVOwner(""); setVPhone(""); setVArea("");
      } else setVMsg("⚠ " + res.error);
    },
    onError: (e) => setVMsg("⚠ " + (e instanceof Error ? e.message : "Register nahi hua")),
  });
  const [pVendor, setPVendor] = useState("");
  const [pName, setPName] = useState("");
  const [pWeight, setPWeight] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pMrp, setPMrp] = useState("");
  const [pCat, setPCat] = useState<"snacks" | "grocery" | "dairy" | "drinks" | "care" | "fruits" | "bakery" | "chocolates" | "babypet" | "frozen">("snacks");
  const [pStock, setPStock] = useState("20");
  const [pMsg, setPMsg] = useState("");
  const vendorAddProduct = useMutation({
    mutationFn: async () => await api.vendorAddProduct({
      vendor_name: pVendor, name: pName.trim(), weight: pWeight.trim(),
      price: Number(pPrice), mrp: Number(pMrp), category: pCat, stock: Number(pStock),
    }),
    onSuccess: (res) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        setPMsg(`✅ "${pName}" live catalog me add ho gaya (ID ${res.id}) — customers abhi order kar sakte hain!`);
        setPName(""); setPWeight(""); setPPrice(""); setPMrp("");
      } else setPMsg("⚠ " + res.error);
    },
    onError: (e) => setPMsg("⚠ " + (e instanceof Error ? e.message : "Product add nahi hua")),
  });
  const [cVendor, setCVendor] = useState("");
  const [cCode, setCCode] = useState("");
  const [cOff, setCOff] = useState("");
  const [cMin, setCMin] = useState("199");
  const [cMsg, setCMsg] = useState("");
  const createCoupon = useMutation({
    mutationFn: async () => await api.createVendorCoupon({ vendor_name: cVendor, code: cCode.trim(), off: Number(cOff), min_order: Number(cMin) }),
    onSuccess: (res) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["vendorCoupons"] });
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        setCMsg(`✅ Coupon ${cCode.toUpperCase()} live hai — customers cart me laga sakte hain!`);
        setCCode(""); setCOff("");
      } else setCMsg("⚠ " + res.error);
    },
    onError: (e) => setCMsg("⚠ " + (e instanceof Error ? e.message : "Coupon nahi bana")),
  });
  const advance = useMutation({
    mutationFn: async (orderId: string) => await api.advanceOrder({ order_id: orderId }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      props.showToast(res.ok ? "Order ek step aage badha ✓ — customer ko update gaya" : (res.error || "Nahi hua"));
    },
    onError: (e) => props.showToast(e instanceof Error ? e.message : "Advance nahi hua"),
  });
  const restock = useMutation({
    mutationFn: async (productId: number) => await api.restockProduct({ product_id: productId, add_qty: 10 }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
      void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      props.showToast(`Restock ho gaya ✓ — naya stock: ${res.new_stock}${res.notified ? " · Notify Me walo ko alert bhi gaya 🔔" : ""}`);
    },
    onError: (e) => props.showToast(e instanceof Error ? e.message : "Restock nahi hua"),
  });
  const d = staff.data;
  const alerts = (staffNotifs.data?.notifications ?? []).filter((n) => n.audience === "vendor");
  const staffFeed = (staffNotifs.data?.notifications ?? []).filter((n) => n.audience === "staff");
  return (
    <div>
      <SheetHead title="🏪 Store Staff Panel" onClose={props.onClose} />
      <p className="text-sm text-[var(--dim)]">Ye panel bhi wahi database use karta hai — customer order kare to yaha turant packing alert aata hai, aur yaha se status badlo to customer ki tracking live badal jati hai.</p>
      {staff.isPending || !d ? <p className="mt-4 text-sm text-[var(--dim)]">Load ho raha hai…</p> : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"><b className="block font-[family-name:var(--font-display)] text-2xl">{d.total_orders}</b><span className="text-xs text-[var(--dim)]">Total orders</span></div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"><b className="block font-[family-name:var(--font-display)] text-2xl">{money(d.total_revenue)}</b><span className="text-xs text-[var(--dim)]">Revenue (DB)</span></div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"><b className="block font-[family-name:var(--font-display)] text-2xl text-[#B42318]">{d.low_stock.length}</b><span className="text-xs text-[var(--dim)]">Low stock items</span></div>
          </div>

          {dash.data && (
            <>
              <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">📊 Sales Dashboard (Asli DB Data)</h3>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--dim)]">Aaj ki kamai</span>
                  <b className="block font-[family-name:var(--font-display)] text-[26px] leading-tight text-[var(--green)]">{money(dash.data.today_revenue)}</b>
                  <span className="text-xs text-[var(--dim)]">{dash.data.today_orders} orders aaj</span>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--dim)]">Total kamai</span>
                  <b className="block font-[family-name:var(--font-display)] text-[26px] leading-tight">{money(dash.data.total_revenue)}</b>
                  <span className="text-xs text-[var(--dim)]">{dash.data.total_orders} orders kul (cancelled hata kar)</span>
                </div>
              </div>
              <div className="mt-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <b className="text-sm">🏆 Top Products (sabse zyada bikne wale)</b>
                {dash.data.top_products.length === 0 ? <p className="mt-1 text-[13px] text-[var(--dim)]">Abhi koi sale nahi — pehla order aate hi yaha chart banega.</p> :
                  dash.data.top_products.map((t) => {
                    const max = Math.max(1, ...dash.data.top_products.map((x) => x.revenue));
                    return (
                      <div key={t.name} className="mt-2.5">
                        <div className="flex justify-between text-[13px]"><span className="min-w-0 flex-1 truncate font-bold">{t.name}</span><span>{t.qty} bikey · {money(t.revenue)}</span></div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--border)]">
                          <div className="h-full rounded-full bg-[var(--green)] transition-all duration-500" style={{ width: `${Math.round((t.revenue / max) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="mt-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <b className="text-sm">📈 Pichhle 7 din ki kamai</b>
                <div className="mt-3 flex h-[110px] items-end gap-2">
                  {dash.data.daily.map((d7) => {
                    const max = Math.max(1, ...dash.data.daily.map((x) => x.revenue));
                    return (
                      <div key={d7.label} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[10px] font-black">{d7.revenue > 0 ? money(d7.revenue) : ""}</span>
                        <div className="w-full rounded-t-md bg-gradient-to-t from-[#FF5E00] to-[#FF9A00] transition-all duration-500" style={{ height: `${Math.max(4, Math.round((d7.revenue / max) * 72))}px` }} />
                        <span className="text-[10px] font-bold text-[var(--dim)]">{d7.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">📣 Packing Queue ({d.pending_orders.length})</h3>
          {d.pending_orders.length === 0 ? <p className="mt-1.5 text-sm text-[var(--dim)]">Abhi packing queue khaali hai — naya order aate hi yaha dikhega.</p> :
            d.pending_orders.map((o) => (
              <div key={o.id} className="mt-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3.5">
                <b className="flex justify-between"><span>{o.id}</span><span className="text-[var(--accent-dark)]">{o.status_label}</span></b>
                <div className="mt-1 text-[13px] text-[var(--dim)]">
                  {o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")} · {money(o.grand_total)} · {o.customer_name}
                  <br />🕐 Slot: {o.delivery_slot}
                  {o.is_gift ? <><br />🎁 GIFT — {o.gift_name} ({o.gift_phone}){o.gift_note ? `: "${o.gift_note}"` : ""}</> : null}
                  {o.instructions ? <><br />🔔 Note: {o.instructions}</> : null}
                </div>
                <div className="mt-2.5 flex gap-2">
                  <button type="button" disabled={advance.isPending} onClick={() => advance.mutate(o.id)}
                    className="flex-1 rounded-xl bg-[var(--green)] py-2.5 font-black text-white disabled:opacity-60">
                    {o.status === "placed" ? "📦 Packing Shuru Karo" : "🛵 Rider Ko De Do"}
                  </button>
                  <button type="button" onClick={() => props.onTrack(o.id)} className="rounded-xl border-[1.5px] border-[var(--border)] px-3.5 font-black">Track</button>
                </div>
              </div>
            ))}

          <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">⚠️ Low Stock — Restock Karo ({d.low_stock.length})</h3>
          {d.low_stock.length === 0 ? <p className="mt-1.5 text-sm text-[var(--dim)]">Sab items ka stock healthy hai.</p> :
            d.low_stock.map((p) => (
              <div key={p.id} className="mt-2.5 flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{p.name}</b>
                  <div className="text-xs text-[var(--dim)]">{p.source === "vendor" ? `Partner: ${p.vendor}` : "Fatafat Dark Store"} · <span className="font-black text-[#B42318]">Sirf {p.stock} bache</span></div>
                </div>
                <button type="button" disabled={restock.isPending} onClick={() => restock.mutate(p.id)}
                  className="rounded-xl bg-[#1E140C] px-3.5 py-2.5 font-black text-white disabled:opacity-60">+10 Restock</button>
              </div>
            ))}

          <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">🔔 Staff Alerts</h3>
          <NotifList items={staffFeed} emptyText="Abhi staff alert nahi." />
          <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">⚠️ Vendor Alerts</h3>
          <NotifList items={alerts} emptyText="Abhi vendor alert nahi." />
        </>
      )}

      {/* ---------- Vendor self-onboarding ---------- */}
      <h3 className="mb-0 mt-7 font-[family-name:var(--font-display)] text-lg font-bold">🏪 Vendor Bano — Apni Dukaan Jodo</h3>
      <p className="mt-1 text-[13px] text-[var(--dim)]">Dukandaar khud register karke Fatafat partner ban sakta hai — registration database me save hoti hai, phir wahi vendor apne products aur coupons khud add kar sakta hai.</p>
      <div className="mt-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <label className="block text-[13px] font-bold" htmlFor="vShop">Dukaan ka naam</label>
        <input id="vShop" {...FIELDS.registerVendor.shop_name} value={vShop} onChange={(e) => setVShop(e.target.value)} placeholder="Jaise: Verma Kirana Store" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
        <label className="mt-3 block text-[13px] font-bold" htmlFor="vOwner">Malik ka naam</label>
        <input id="vOwner" {...FIELDS.registerVendor.owner_name} value={vOwner} onChange={(e) => setVOwner(e.target.value)} placeholder="Tumhara naam" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mt-3 block text-[13px] font-bold" htmlFor="vPhone">Mobile number</label>
            <input id="vPhone" {...FIELDS.registerVendor.phone} value={vPhone} onChange={(e) => setVPhone(e.target.value)} placeholder="10-digit mobile" inputMode="tel" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
          </div>
          <div className="flex-1">
            <label className="mt-3 block text-[13px] font-bold" htmlFor="vArea">Area</label>
            <input id="vArea" {...FIELDS.registerVendor.area} value={vArea} onChange={(e) => setVArea(e.target.value)} placeholder="Jaise: Sector 62" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
          </div>
        </div>
        {vMsg && <p className="mt-2 text-[13px] font-bold">{vMsg}</p>}
        <button type="button" disabled={registerVendor.isPending}
          onClick={() => {
            if (vShop.trim().length < 3 || vOwner.trim().length < 2 || vArea.trim().length < 2) { setVMsg("⚠ Dukaan ka naam, malik ka naam aur area sahi se bharo"); return; }
            registerVendor.mutate();
          }}
          className="mt-3 w-full rounded-[14px] bg-[var(--accent)] py-3 font-black text-white disabled:opacity-60">🏪 Dukaan Register Karo</button>
        {(vendorList.data?.vendors.length ?? 0) > 0 && (
          <div className="mt-3">
            <b className="text-[13px]">Registered dukaanen:</b>
            {vendorList.data?.vendors.map((v) => (
              <div key={v.id} className="mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px]">
                🏪 <b>{v.shop_name}</b> — {v.owner_name} · {v.area} · {v.phone}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <b className="font-[family-name:var(--font-display)] text-base">🛍️ Vendor — Apna Product Add Karo</b>
        <label className="mt-2.5 block text-[13px] font-bold" htmlFor="pVendor">Tumhari dukaan</label>
        <select id="pVendor" value={pVendor} onChange={(e) => { setPVendor(e.target.value); setCVendor(e.target.value); }}
          className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]">
          <option value="">— Dukaan chuno —</option>
          {["Sharma General Store", "Gupta Snacks Corner", "City Care Store", ...(vendorList.data?.vendors.map((v) => v.shop_name) ?? [])].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <label className="mt-3 block text-[13px] font-bold" htmlFor="pName">Product ka naam</label>
        <input id="pName" {...FIELDS.vendorAddProduct.name} value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Jaise: Special Mixture Namkeen" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mt-3 block text-[13px] font-bold" htmlFor="pWeight">Weight</label>
            <input id="pWeight" {...FIELDS.vendorAddProduct.weight} value={pWeight} onChange={(e) => setPWeight(e.target.value)} placeholder="500 g" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
          </div>
          <div className="flex-1">
            <label className="mt-3 block text-[13px] font-bold" htmlFor="pCat">Category</label>
            <select id="pCat" value={pCat} onChange={(e) => setPCat(e.target.value as typeof pCat)} className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]">
              {CATS.slice(1).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mt-3 block text-[13px] font-bold" htmlFor="pPrice">Price (₹)</label>
            <input id="pPrice" {...FIELDS.vendorAddProduct.price} value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="99" inputMode="numeric" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
          </div>
          <div className="flex-1">
            <label className="mt-3 block text-[13px] font-bold" htmlFor="pMrp">MRP (₹)</label>
            <input id="pMrp" {...FIELDS.vendorAddProduct.mrp} value={pMrp} onChange={(e) => setPMrp(e.target.value)} placeholder="120" inputMode="numeric" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
          </div>
          <div className="flex-1">
            <label className="mt-3 block text-[13px] font-bold" htmlFor="pStock">Stock</label>
            <input id="pStock" {...FIELDS.vendorAddProduct.stock} value={pStock} onChange={(e) => setPStock(e.target.value)} placeholder="20" inputMode="numeric" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
          </div>
        </div>
        {pMsg && <p className="mt-2 text-[13px] font-bold">{pMsg}</p>}
        <button type="button" disabled={vendorAddProduct.isPending}
          onClick={() => {
            if (!pVendor) { setPMsg("⚠ Pehle apni dukaan chuno"); return; }
            if (pName.trim().length < 3 || pWeight.trim().length < 2 || !(Number(pPrice) > 0) || !(Number(pMrp) > 0) || !(Number(pStock) > 0)) { setPMsg("⚠ Naam, weight, price, MRP aur stock sahi se bharo"); return; }
            vendorAddProduct.mutate();
          }}
          className="mt-3 w-full rounded-[14px] bg-[var(--green)] py-3 font-black text-white disabled:opacity-60">+ Product Live Karo</button>
      </div>

      <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <b className="font-[family-name:var(--font-display)] text-base">🎟️ Vendor — Apna Coupon Banao</b>
        <label className="mt-2.5 block text-[13px] font-bold" htmlFor="cVendor">Tumhari dukaan</label>
        <select id="cVendor" value={cVendor} onChange={(e) => setCVendor(e.target.value)}
          className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]">
          <option value="">— Dukaan chuno —</option>
          {["Sharma General Store", "Gupta Snacks Corner", "City Care Store", ...(vendorList.data?.vendors.map((v) => v.shop_name) ?? [])].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <div className="flex-[1.4]">
            <label className="mt-3 block text-[13px] font-bold" htmlFor="cCode">Coupon code</label>
            <input id="cCode" {...FIELDS.createVendorCoupon.code} value={cCode} onChange={(e) => setCCode(e.target.value.toUpperCase())} placeholder="Jaise: VERMA50" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 font-extrabold uppercase" />
          </div>
          <div className="flex-1">
            <label className="mt-3 block text-[13px] font-bold" htmlFor="cOff">₹ OFF</label>
            <input id="cOff" {...FIELDS.createVendorCoupon.off} value={cOff} onChange={(e) => setCOff(e.target.value)} placeholder="50" inputMode="numeric" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
          </div>
          <div className="flex-1">
            <label className="mt-3 block text-[13px] font-bold" htmlFor="cMin">Min order ₹</label>
            <input id="cMin" {...FIELDS.createVendorCoupon.min_order} value={cMin} onChange={(e) => setCMin(e.target.value)} placeholder="199" inputMode="numeric" className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
          </div>
        </div>
        {cMsg && <p className="mt-2 text-[13px] font-bold">{cMsg}</p>}
        <button type="button" disabled={createCoupon.isPending}
          onClick={() => {
            if (!cVendor) { setCMsg("⚠ Pehle apni dukaan chuno"); return; }
            if (cCode.trim().length < 4 || !(Number(cOff) >= 5)) { setCMsg("⚠ Code kam se kam 4 akshar aur OFF kam se kam ₹5 rakho"); return; }
            createCoupon.mutate();
          }}
          className="mt-3 w-full rounded-[14px] bg-[#1E140C] py-3 font-black text-white disabled:opacity-60">🎟️ Coupon Live Karo</button>
        {(vendorCoupons.data?.coupons.length ?? 0) > 0 && (
          <div className="mt-3">
            <b className="text-[13px]">Live vendor coupons:</b>
            {vendorCoupons.data?.coupons.map((c) => (
              <div key={c.id} className="mt-1.5 rounded-xl border border-dashed border-[#FF9A5C] bg-[#FFFBF6] px-3 py-2 text-[13px]">
                🎟️ <b>{c.code}</b> — ₹{c.off} OFF, min {money(c.min_order)} · {c.vendor_name}
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="button" onClick={props.onClose} className="mt-5 w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">Band Karo</button>
    </div>
  );
}

/* ================================================================== */
/* Tracking sheet (live, polled from the server)                       */
/* ================================================================== */

const TRACK_STEPS = [
  { icon: "✅", label: "Order Place Hua", desc: "Tumhara order mil gaya hai" },
  { icon: "📦", label: "Packing Ho Rahi Hai", desc: "Store staff samaan pack kar raha hai" },
  { icon: "🛵", label: "Rider Raste Me Hai", desc: "Ramesh tumhare ghar ki taraf nikal pada" },
  { icon: "🎉", label: "Delivered", desc: "Samaan pahunch gaya — enjoy!" },
];

function TrackingSheet(props: {
  orderId: string;
  geofenceKm: number;
  onClose: () => void;
  showToast: (m: string) => void;
  onReorder: (o: Order) => void;
  onBill: (id: string) => void;
  chat: { from: "me" | "rider"; text: string }[];
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  onSendChat: (text: string) => void;
}) {
  const queryClient = useQueryClient();
  const [chatText, setChatText] = useState("");
  const [callMsg, setCallMsg] = useState("");
  const q = useQuery({
    queryKey: ["order", props.orderId],
    queryFn: () => api.getOrder({ order_id: props.orderId }),
    refetchInterval: 4000,
  });
  const cancel = useMutation({
    mutationFn: async () => await api.cancelOrder({ order_id: props.orderId }),
    onSuccess: (res) => {
      if (res.ok) {
        props.showToast("Order cancel ho gaya — stock wapas inventory me add ho gaya");
        void queryClient.invalidateQueries({ queryKey: ["order", props.orderId] });
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        void queryClient.invalidateQueries({ queryKey: ["staff"] });
      } else props.showToast(res.error);
    },
    onError: (e) => props.showToast(e instanceof Error ? e.message : "Cancel nahi hua"),
  });
  const rate = useMutation({
    mutationFn: async (r: number) => await api.rateOrder({ order_id: props.orderId, rating: r }),
    onSuccess: () => {
      props.showToast("Rating ke liye shukriya! ⭐");
      void queryClient.invalidateQueries({ queryKey: ["order", props.orderId] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => props.showToast(e instanceof Error ? e.message : "Rating save nahi hui"),
  });

  const o = q.data?.order;
  if (q.isPending) return <div><SheetHead title="🛵 Tracking" onClose={props.onClose} /><p className="mt-4 text-sm text-[var(--dim)]">Order load ho raha hai…</p></div>;
  if (!o) return <div><SheetHead title="🛵 Tracking" onClose={props.onClose} /><p className="mt-4 text-sm text-[var(--dim)]">Ye order database me nahi mila.</p></div>;

  const step = o.status_step;
  const progress = o.status === "cancelled" ? 0 : ((step + 1) / TRACK_STEPS.length) * 100;
  const kmLeft = o.status === "delivered" || o.status === "cancelled" ? "0" : (Math.max(0.1, 1.6 - step * 0.55)).toFixed(1);

  return (
    <div>
      <SheetHead title={`🛵 Order ${o.id}`} onClose={props.onClose} />
      <p className="text-sm text-[var(--dim)]">{o.items_count} items · {money(o.grand_total)} · {o.payment_detail || o.payment_method} · {escTime(o.created_at)} · Status server se live aa raha hai</p>

      {o.status === "cancelled" ? (
        <div className="mt-4 rounded-[18px] border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] p-4 text-center">
          <b className="text-lg text-[#B42318]">❌ Ye order cancel ho chuka hai</b>
          <p className="mt-1 text-sm text-[var(--dim)]">Is order ka stock inventory me wapas add ho gaya hai.</p>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
            <b className="font-[family-name:var(--font-display)] text-[38px] font-extrabold leading-none text-[var(--accent-dark)]">
              {o.status === "delivered" ? "Aa gaya! 🎉" : `${o.eta_minutes} min`}
            </b>
            <p className="mt-1 text-[var(--dim)]">{o.status === "delivered" ? "Tumhara order deliver ho gaya" : `me pahunch jayega · Rider ${kmLeft} km door hai`}</p>
            <span className="mt-2 inline-block rounded-full bg-[#1E140C] px-2.5 py-1.5 text-xs font-black text-white">📍 Live · {props.geofenceKm} km geofence ke andar ✓</span>
          </div>
          <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-[var(--border)]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#FF5E00] to-[#FF9A00] transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <div>
            {TRACK_STEPS.map((s, i) => (
              <div key={s.label} className="flex gap-3 border-b border-dashed border-[var(--border)] py-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] ${i < step || o.status === "delivered" && i === 3 ? "border-[var(--green)] bg-[var(--green)] text-white" : i === step ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>{s.icon}</div>
                <div>
                  <b>{s.label}{i === step && o.status !== "delivered" ? " · Abhi ye chal raha hai" : ""}</b>
                  <p className="mt-0.5 text-[13px] text-[var(--dim)]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
            <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-[#FFE0C7] text-[26px]">🛵</div>
            <div className="flex-1">
              <b>{RIDER.name}</b>
              <div className="text-[13px] text-[var(--dim)]">Tumhara delivery partner · {RIDER.vehicle} · ★ {RIDER.rating}</div>
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => setCallMsg(`📞 ${RIDER.name} ko call lag raha hai… (demo call)`)} className="rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">📞 Call Karo</button>
            <button type="button" onClick={() => props.setChatOpen(!props.chatOpen)} className="rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">💬 Chat Karo</button>
          </div>
          {callMsg && <p className="mt-2 text-center text-[13px] font-bold">{callMsg}</p>}
          {props.chatOpen && (
            <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
              <b>💬 Rider se chat</b>
              <div className="mt-1.5 rounded-[14px] bg-[#FFF1E6] p-2.5 text-sm">Namaste! Main tumhara order lekar nikal raha hu 🛵</div>
              {props.chat.map((m, i) => (
                <div key={i} className={`mt-2 rounded-[14px] p-2.5 text-sm ${m.from === "me" ? "bg-[var(--green-bg)] text-right" : "bg-[#FFF1E6]"}`}>{m.text}</div>
              ))}
              <div className="mt-2.5 flex gap-2">
                <label className="sr-only" htmlFor="chatInput">Rider ko message likho</label>
                <input id="chatInput" value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Message likho…"
                  className="min-w-0 flex-1 rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter" && chatText.trim()) { props.onSendChat(chatText.trim()); setChatText(""); } }} />
                <button type="button" onClick={() => { if (chatText.trim()) { props.onSendChat(chatText.trim()); setChatText(""); } }}
                  className="rounded-xl bg-[#1E140C] px-4 font-black text-white">Bhejo</button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <b>🧾 Order ki details</b>
        {o.items.map((i) => (
          <div key={i.product_id} className="flex justify-between py-1 text-sm"><span>{i.name} × {i.qty}</span><span>{money(i.price * i.qty)}</span></div>
        ))}
        <div className="flex justify-between py-1 text-sm"><span>Delivery</span><span>{o.delivery_fee === 0 ? "FREE" : money(o.delivery_fee)}</span></div>
        {o.discount > 0 && <div className="flex justify-between py-1 text-sm font-bold text-[var(--green)]"><span>Coupon {o.coupon_code}</span><span>− {money(o.discount)}</span></div>}
        {o.coins_redeemed > 0 && <div className="flex justify-between py-1 text-sm font-bold text-[var(--green)]"><span>🪙 Fatafat Coins use hue</span><span>− {money(o.coins_redeemed)}</span></div>}
        {o.coins_earned > 0 && <div className="flex justify-between py-1 text-sm font-bold text-[#8A6D00]"><span>🪙 Coins cashback milega</span><span>+ {o.coins_earned} coins</span></div>}
        <div className="mt-1 flex justify-between border-t border-dashed border-[var(--border)] pt-2.5 font-black"><span>Total</span><span>{money(o.grand_total)}</span></div>
        <p className="mt-2 text-[13px] text-[var(--dim)]">📍 {o.address_label} — {o.address_text} ({o.area_name})</p>
        <p className="mt-1 text-[13px] text-[var(--dim)]">🕐 Delivery slot: <b className="text-[var(--text)]">{o.delivery_slot}</b></p>
        {o.is_gift && (
          <p className="mt-1 text-[13px] text-[var(--dim)]">🎁 <b className="text-[var(--text)]">Gift order</b> — {o.gift_name} ({o.gift_phone}){o.gift_note ? <> · Note: "{o.gift_note}"</> : null}</p>
        )}
        {o.instructions && <p className="mt-1 text-[13px] text-[var(--dim)]">🔔 Instructions: {o.instructions}</p>}
      </div>

      {o.status === "delivered" && (
        <div className="mt-4 text-center">
          <b>Order kaisa laga? Rating do ⭐</b>
          <div className="my-3 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((r) => (
              <button key={r} type="button" aria-label={`${r} star rating do`} onClick={() => rate.mutate(r)}
                className={`grid h-12 w-12 place-items-center rounded-full border-[1.5px] text-[22px] ${(o.rating ?? 0) >= r ? "border-[var(--accent)] bg-[#FFF1E6]" : "border-[var(--border)] bg-[var(--surface)]"}`}>⭐</button>
            ))}
          </div>
          {o.rating ? <p className="text-sm font-bold text-[var(--green)]">Tumhari rating: {o.rating} ⭐ — database me save hai</p> : null}
        </div>
      )}

      <button type="button" onClick={() => props.onBill(o.id)} className="mt-4 w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3.5 font-black">🧾 Bill Dekho / Download Karo</button>
      <button type="button" onClick={() => props.onReorder(o)} className="mt-2.5 w-full rounded-[14px] bg-[var(--accent)] py-3.5 font-black text-white">🔁 Ek Click Re-Order</button>
      {o.status !== "delivered" && o.status !== "cancelled" && (
        <button type="button" disabled={cancel.isPending} onClick={() => cancel.mutate()}
          className="mt-2.5 w-full rounded-[14px] border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] py-3 font-black text-[#B42318] disabled:opacity-60">
          ❌ Order Cancel Karo (stock wapas ho jayega)
        </button>
      )}
      <button type="button" onClick={props.onClose} className="mt-2.5 w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">Shopping Jaari Rakho</button>
    </div>
  );
}

/* ================================================================== */
/* AI Order Assistant sheet                                            */
/* ================================================================== */

type AiItem = ApiResponse<typeof api, "aiAssistant">["items"][number];

function AssistantSheet(props: {
  onClose: () => void;
  showToast: (m: string) => void;
  onAddItems: (items: { product_id: number; qty: number }[]) => void;
  onOpenCart: () => void;
}) {
  const [msgs, setMsgs] = useState<{ from: "me" | "ai"; text: string }[]>([
    { from: "ai", text: "Namaste! Main Fatafat ka AI assistant hu 🤖 Likho kya chahiye — jaise \"chai ka samaan bhej do\" ya \"2 doodh aur 1 bread\" — main asli catalog se cart bana dunga." },
  ]);
  const [input, setInput] = useState("");
  const [proposal, setProposal] = useState<AiItem[] | null>(null);
  const ask = useMutation({
    mutationFn: async (m: string) => await api.aiAssistant({ message: m }),
    onSuccess: (res) => {
      setMsgs((prev) => [...prev, { from: "ai" as const, text: res.reply }]);
      setProposal(res.items.length ? res.items : null);
    },
    onError: (e) => {
      setMsgs((prev) => [...prev, { from: "ai" as const, text: "Network/AI abhi slow hai — ek baar phir likho, ya neeche ke ready options try karo." }]);
      props.showToast(e instanceof Error ? e.message : "AI assistant nahi chala");
    },
  });
  const send = (text: string) => {
    const t = text.trim();
    if (t.length < 2 || ask.isPending) return;
    setMsgs((prev) => [...prev, { from: "me" as const, text: t }]);
    setInput("");
    ask.mutate(t);
  };
  const proposalTotal = (proposal ?? []).reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div>
      <SheetHead title="🤖 AI Order Assistant" onClose={props.onClose} />
      <p className="text-sm text-[var(--dim)]">Bas likh do kya chahiye — AI asli catalog (live stock ke saath) se items chun kar cart bana dega. Confirm karne par hi cart me jayega.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Chai ka samaan bhej do", "2 doodh aur 1 bread", "Nashta ka pack bana do", "Party ke liye chips aur cold drink", "1 kg atta aur 500g chini jaisa kuch"].map((s) => (
          <button key={s} type="button" onClick={() => send(s)}
            className="rounded-full border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] font-extrabold">
            {s}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {msgs.map((m, i) => (
          <div key={i} className={`mt-2 max-w-[88%] rounded-[16px] p-3 text-sm leading-relaxed ${m.from === "me" ? "ml-auto bg-[var(--green-bg)] text-right" : "bg-[#FFF1E6]"}`}>
            {m.text}
          </div>
        ))}
        {ask.isPending && <div className="mt-2 max-w-[88%] rounded-[16px] bg-[#FFF1E6] p-3 text-sm">🤖 Soch raha hu… catalog me dhoondh raha hu</div>}
      </div>
      {proposal && (
        <div className="ff-drop-in mt-4 rounded-2xl border-[1.5px] border-[var(--green)] bg-[var(--surface)] p-4">
          <b>🛒 AI ne ye cart banaya hai:</b>
          {proposal.map((i) => (
            <div key={i.product_id} className="flex justify-between py-1.5 text-sm">
              <span>{i.name} ({i.weight}) × {i.qty}</span><span>{money(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-dashed border-[var(--border)] pt-2.5 font-black"><span>Total</span><span>{money(proposalTotal)}</span></div>
          <button type="button"
            onClick={() => {
              props.onAddItems(proposal.map((i) => ({ product_id: i.product_id, qty: i.qty })));
              props.showToast("🤖 AI wala cart asli cart me add ho gaya ✓");
              setProposal(null);
              props.onOpenCart();
            }}
            className="mt-3 w-full rounded-[14px] bg-[var(--green)] py-3.5 font-black text-white">✓ Confirm — Cart Me Daalo</button>
          <button type="button" onClick={() => setProposal(null)} className="mt-2 w-full rounded-[14px] border-[1.5px] border-[var(--border)] py-3 font-black">Nahi, rehne do</button>
        </div>
      )}
      <div className="sticky bottom-0 mt-4 flex gap-2 bg-[var(--bg)] pb-1 pt-2">
        <label className="sr-only" htmlFor="aiInput">AI assistant ko likho</label>
        <input id="aiInput" {...FIELDS.aiAssistant.message} value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Likho: kya-kya chahiye…"
          className="min-w-0 flex-1 rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]"
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }} />
        <button type="button" disabled={ask.isPending} onClick={() => send(input)}
          className="rounded-xl bg-[var(--accent)] px-4 font-black text-white disabled:opacity-60">Bhejo</button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Bill sheet (formatted invoice + download)                           */
/* ================================================================== */

function BillSheet(props: { orderId: string; onClose: () => void; showToast: (m: string) => void }) {
  const q = useQuery({
    queryKey: ["order", props.orderId],
    queryFn: () => api.getOrder({ order_id: props.orderId }),
  });
  const o = q.data?.order;
  const download = () => {
    if (!o) return;
    // Every interpolated value is HTML-escaped: product names can be written
    // by vendors (vendorAddProduct) and order fields by customers, so raw
    // markup from another party must never land in the downloaded bill.
    const esc = (v: string | number) => String(v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const rows = o.items.map((i) => `<tr><td>${esc(i.name)} (${esc(i.weight)})</td><td style="text-align:center">${esc(i.qty)}</td><td style="text-align:right">₹${esc(i.price)}</td><td style="text-align:right">₹${esc(i.price * i.qty)}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Fatafat Bill ${esc(o.id)}</title><style>body{font-family:Arial,sans-serif;max-width:560px;margin:24px auto;color:#1e140c;padding:0 16px}h1{color:#e04e00;margin:0}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{padding:7px 4px;border-bottom:1px dashed #ccc;font-size:14px}.tot{font-weight:900;font-size:16px}small{color:#7a6a5e}</style></head><body>
<h1>fatafat</h1><small>Groceries, fatafat ghar par · Tax Invoice / Bill</small>
<p><b>Order:</b> ${esc(o.id)}<br><b>Customer:</b> ${esc(o.customer_name)} · ${esc(o.phone)}<br><b>Address:</b> ${esc(o.address_label)} — ${esc(o.address_text)} (${esc(o.area_name)})<br><b>Slot:</b> ${esc(o.delivery_slot)}<br><b>Payment:</b> ${esc(o.payment_detail || o.payment_method)}<br><b>Status:</b> ${esc(o.status_label)}</p>
${o.is_gift ? `<p><b>🎁 Gift order</b> — ${esc(o.gift_name)} (${esc(o.gift_phone)})${o.gift_note ? `<br>Note: "${esc(o.gift_note)}"` : ""}</p>` : ""}
<table><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr>${rows}
<tr><td colspan="3">Subtotal</td><td style="text-align:right">₹${esc(o.subtotal)}</td></tr>
${o.discount > 0 ? `<tr><td colspan="3">Coupon ${esc(o.coupon_code)} discount</td><td style="text-align:right">− ₹${esc(o.discount)}</td></tr>` : ""}
${o.coins_redeemed > 0 ? `<tr><td colspan="3">Fatafat Coins</td><td style="text-align:right">− ₹${esc(o.coins_redeemed)}</td></tr>` : ""}
<tr><td colspan="3">Delivery</td><td style="text-align:right">${o.delivery_fee === 0 ? "FREE" : "₹" + esc(o.delivery_fee)}</td></tr>
<tr class="tot"><td colspan="3">Total</td><td style="text-align:right">₹${esc(o.grand_total)}</td></tr></table>
<p><small>Print karne ke liye: browser menu → Print / Save as PDF. Dhanyavaad! Fatafat © 2026</small></p></body></html>`;
    try {
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Fatafat-Bill-${o.id}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      props.showToast("🧾 Bill download ho gaya — khol kar Print → Save as PDF kar sakte ho");
    } catch {
      props.showToast("Download is browser me block hai — bill yahi screen par hai, screenshot le lo");
    }
  };
  return (
    <div>
      <SheetHead title="🧾 Order Bill" onClose={props.onClose} />
      {q.isPending || !o ? <p className="mt-4 text-sm text-[var(--dim)]">Bill load ho raha hai…</p> : (
        <>
          <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-center">
              <div className="font-[family-name:var(--font-display)] text-[28px] font-extrabold text-[var(--accent-dark)]">fata<span className="text-[var(--accent)]">fat</span></div>
              <p className="text-xs text-[var(--dim)]">Groceries, fatafat ghar par · Tax Invoice / Bill</p>
            </div>
            <div className="mt-3 border-t border-dashed border-[var(--border)] pt-3 text-[13px] leading-relaxed">
              <div className="flex justify-between"><span>Order</span><b>{o.id}</b></div>
              <div className="flex justify-between"><span>Customer</span><b>{o.customer_name}</b></div>
              <div className="flex justify-between"><span>Phone</span><b>{o.phone}</b></div>
              <div className="flex justify-between"><span>Slot</span><b>{o.delivery_slot}</b></div>
              <div className="flex justify-between"><span>Payment</span><b>{o.payment_detail || o.payment_method}</b></div>
              <div className="flex justify-between"><span>Status</span><b>{o.status_label}</b></div>
              {o.is_gift && <div className="flex justify-between"><span>🎁 Gift</span><b>{o.gift_name} ({o.gift_phone})</b></div>}
              {o.is_gift && o.gift_note && <div className="mt-1 rounded-lg bg-[#FDF2F8] p-2 text-center font-bold">💌 "{o.gift_note}"</div>}
            </div>
            <div className="mt-3 border-t border-dashed border-[var(--border)] pt-3">
              {o.items.map((i) => (
                <div key={i.product_id} className="flex justify-between py-1 text-sm">
                  <span>{i.name} ({i.weight}) × {i.qty}</span><span>{money(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 text-sm"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
              {o.discount > 0 && <div className="flex justify-between py-1 text-sm font-bold text-[var(--green)]"><span>Coupon {o.coupon_code}</span><span>− {money(o.discount)}</span></div>}
              {o.coins_redeemed > 0 && <div className="flex justify-between py-1 text-sm font-bold text-[var(--green)]"><span>🪙 Fatafat Coins</span><span>− {money(o.coins_redeemed)}</span></div>}
              <div className="flex justify-between py-1 text-sm"><span>Delivery</span><span>{o.delivery_fee === 0 ? "FREE" : money(o.delivery_fee)}</span></div>
              <div className="mt-1.5 flex justify-between border-t border-dashed border-[var(--border)] pt-2.5 text-base font-black"><span>Total</span><span>{money(o.grand_total)}</span></div>
            </div>
            <p className="mt-3 text-center text-xs text-[var(--dim)]">📍 {o.address_label} — {o.address_text} ({o.area_name})<br />Dhanyavaad! Phir aana 🙏</p>
          </div>
          <button type="button" onClick={download} className="mt-4 w-full rounded-[14px] bg-[var(--accent)] py-3.5 font-black text-white">⬇️ Bill Download Karo (Print → PDF)</button>
          <p className="mt-1.5 text-center text-xs text-[var(--dim)]">Download hui file khol kar browser ke Print option se proper PDF bill ban jayega.</p>
          <button type="button" onClick={props.onClose} className="mt-2.5 w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">Band Karo</button>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/* Customer Login / Sign Up sheet                                      */
/* ================================================================== */

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function useCountdown(secs: number, setSecs: (n: number) => void) {
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(secs - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, setSecs]);
}

function AuthSheet(props: {
  onClose: () => void;
  showToast: (m: string) => void;
  onLoggedIn: (token: string, name: string) => void;
}) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [lockSecs, setLockSecs] = useState(0);
  useCountdown(lockSecs, setLockSecs);

  const login = useMutation({
    mutationFn: async () => await api.customerLogin({ phone: phone.trim(), pin }),
    onSuccess: (res) => {
      if (res.ok) props.onLoggedIn(res.token, res.name);
      else { setErr(res.error); if (res.locked_seconds > 0) setLockSecs(res.locked_seconds); }
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Login nahi hua — phir try karo"),
  });
  const signup = useMutation({
    mutationFn: async () => await api.customerSignup({ name: name.trim(), phone: phone.trim(), pin }),
    onSuccess: (res) => {
      if (res.ok) props.onLoggedIn(res.token, res.name);
      else setErr(res.error);
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Sign up nahi hua — phir try karo"),
  });

  const phoneOk = () => {
    const digits = phone.replace(/\D/g, "");
    const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
    return /^[6-9]\d{9}$/.test(local);
  };
  const pinOk = () => /^\d{4,6}$/.test(pin);
  const submit = () => {
    setErr("");
    if (!phoneOk()) { setErr("Sahi 10-digit mobile number likho (+91 / 0 wala bhi chalega)."); return; }
    if (!pinOk()) { setErr("PIN 4–6 digit ka number hona chahiye (sirf digits)."); return; }
    if (tab === "signup" && name.trim().length < 2) { setErr("Apna naam likho (kam se kam 2 akshar)."); return; }
    if (tab === "login") login.mutate(); else signup.mutate();
  };

  const inputCls = "mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]";
  return (
    <div>
      <SheetHead title="👤 Mera Account" onClose={props.onClose} />
      <div className="mt-3 grid grid-cols-2 gap-2" role="tablist" aria-label="Login ya Sign Up">
        {([["login", "🔑 Login"], ["signup", "✨ Sign Up — Naya Account"]] as const).map(([t, label]) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setErr(""); }}
            className={`rounded-[14px] border-[1.5px] py-3 font-black ${tab === t ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>
            {label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--dim)]">
        {tab === "login"
          ? "Apne mobile number aur PIN se login karo — login hote hi tumhare apne orders, coins, subscriptions aur addresses load ho jayenge."
          : "Naya account banao: naam, mobile number aur ek 4–6 digit ka login PIN rakho. Ek number se sirf ek hi account banta hai."}
      </p>

      {tab === "signup" && (
        <>
          <label className="mt-4 block text-[13px] font-bold" htmlFor="suName">Tumhara naam</label>
          <input id="suName" {...FIELDS.customerSignup.name} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jaise: Rahul Verma" className={inputCls} />
        </>
      )}
      <label className="mt-4 block text-[13px] font-bold" htmlFor="authPhone">Mobile number</label>
      <input id="authPhone" {...FIELDS.customerLogin.phone} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile (+91 bhi chalega)" inputMode="tel" className={inputCls} />
      <label className="mt-3 block text-[13px] font-bold" htmlFor="authPin">{tab === "login" ? "Tumhara login PIN" : "Login PIN banao (4–6 digit)"}</label>
      <input id="authPin" {...FIELDS.customerLogin.pin} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" inputMode="numeric" type="password" autoComplete="off" className={inputCls}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
      <p className="mt-1.5 text-xs text-[var(--dim)]">PIN server par hash hokar save hota hai — koi use plain text me dekh nahi sakta. 5 baar galat PIN daalne par account 5 minute ke liye lock ho jata hai.</p>

      {err && <div className="mt-3 rounded-[14px] border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] p-3 text-sm font-bold text-[#7A271A]">⚠ {err}</div>}
      {lockSecs > 0 && <p className="mt-2 text-center text-sm font-black text-[#B42318]">⏳ Account lock hai — {Math.floor(lockSecs / 60)}:{String(lockSecs % 60).padStart(2, "0")} baad phir try karo</p>}

      <button type="button" disabled={login.isPending || signup.isPending || lockSecs > 0} onClick={submit}
        className="mt-4 w-full rounded-[14px] bg-[var(--accent)] py-3.5 text-base font-black text-white disabled:opacity-60">
        {login.isPending || signup.isPending ? "Ek second…" : tab === "login" ? "🔑 Login Karo" : "✨ Account Banao & Login Karo"}
      </button>

      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[13px] leading-relaxed">
        <b>📱 OTP login kab aayega?</b>
        <p className="mt-1 text-[var(--dim)]">Sach ye hai: OTP login ke liye SMS bhejne wala provider (MSG91 / Twilio jaisa) connect karna padta hai, aur wo abhi connected nahi hai. Jaise hi SMS provider jud jayega, OTP login bhi aa jayega. Tab tak mobile number + PIN login hi secure tareeka hai — PIN hamesha server par verify hota hai.</p>
      </div>
      <p className="mt-3 text-center text-xs text-[var(--dim)]">Bina account ke bhi shopping ho sakti hai — tab tum Guest (Demo) account par rehte ho.</p>
    </div>
  );
}

/* ================================================================== */
/* Help & Support sheet                                                */
/* ================================================================== */

const FAQS: { q: string; a: string }[] = [
  { q: "Order kaise karun?", a: "Home par product chuno, ADD dabao, neeche wali hari bar se Cart kholo. Naam, mobile, address bhardo, payment ka tareeka chuno aur 'Order Place Karo' dabao — order turant database me save hota hai aur store staff ko packing alert chala jata hai. Tracking screen par live status dikhta hai." },
  { q: "Delivery kitni der me hoti hai?", a: "Serviceable area (geofence radius ke andar) me aam taur par 8–12 minute. Kuch areas me kuch items nahi milte — product par 'Is Area Me Nahi' likha dikhega. Delivery kab chahiye, wo checkout par slot chun kar bhi bata sakte ho (abhi, shaam ko, kal subah…)." },
  { q: "Payment ke options kya hain?", a: "Cash on Delivery, UPI (GPay / PhonePe / Paytm / BHIM), Card aur Wallets (Paytm / Amazon Pay / Mobikwik). Abhi payment demo mode me hai — asli paisa tab katega jab owner apna payment provider (Razorpay type) account connect karega. Saare bill ke hisaab (total, discount, coins) server par bante hain." },
  { q: "Order cancel ya refund kaise hoga?", a: "Order delivered hone se pehle Tracking screen par 'Order Cancel Karo' dabao. Cancel hote hi stock inventory me wapas aa jata hai, aur agar coins use kiye the to wo bhi wallet me wapas aa jate hain (cashback coins adjust ho jate hain). COD orders me paisa liya hi nahi gaya hota, isliye alag se refund ka jhanjhat nahi." },
  { q: "Fatafat Coins kaise use karun?", a: "Har order par bill ka 5% coins me wapas milta hai — 1 coin = ₹1. Cart kholo, 'Coins Use Karo' dabao, bill utna hi kam ho jayega. Dost ka referral code Profile me lagane par 50 coins (₹50) free milte hain. Coins aur unka poora hisaab Profile → Fatafat Coins Wallet me dikhta hai." },
  { q: "Subscription kaise band karun?", a: "Profile → My Subscriptions me jao. 'Pause Karo' se subscription kuch samay ke liye ruk jati hai (phir 'Phir Shuru Karo' se chal padti hai), aur 'Cancel Karo' se poori tarah band ho jati hai. Cancel wali subscription dobara start nahi hoti — product page se nayi banani padegi." },
  { q: "Login OTP se kyun nahi hota?", a: "OTP login ke liye SMS bhejne wala provider (MSG91 / Twilio jaisa) connect karna padta hai — wo abhi connected nahi hai. Provider judte hi OTP login aa jayega. Tab tak mobile number + PIN login hi secure method hai: PIN server par hash hokar rehta hai aur 5 galat koshishon par account lock ho jata hai." },
  { q: "Mera area delivery radius ke bahar hai, kya karun?", a: "Upar wale address bar se 'Area Badlo' karke dekho — kabhi-kabhi paas wala area serviceable hota hai. Radius store admin settings se set hota hai; agar tumhare area me demand zyada hai to neeche 'Problem batao' me likh do, team area expand karne par vichaar karegi." },
];

function HelpSheet(props: {
  onClose: () => void;
  showToast: (m: string) => void;
  profileName: string;
  profilePhone: string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [name, setName] = useState(props.profileName);
  const [mobile, setMobile] = useState(props.profilePhone);
  const [message, setMessage] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [sentId, setSentId] = useState(0);
  const submit = useMutation({
    mutationFn: async () => await api.submitSupportTicket({ name: name.trim(), mobile: mobile.trim(), message: message.trim() }),
    onSuccess: (res) => {
      if (res.ok) {
        setSentId(res.id);
        setFormMsg("");
        setMessage("");
        props.showToast("🆘 Tumhari problem team tak pahunch gayi — jald jawab milega!");
      } else setFormMsg("⚠ " + res.error);
    },
    onError: (e) => setFormMsg("⚠ " + (e instanceof Error ? e.message : "Request nahi gayi — phir try karo")),
  });
  const inputCls = "mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]";
  return (
    <div>
      <SheetHead title="❓ Help & Support" onClose={props.onClose} />
      <p className="text-sm text-[var(--dim)]">Pehle neeche ke sawal-jawab dekho — zyadatar problems wahi solve ho jati hain. Phir bhi atak jao to team ko seedha batao.</p>

      <h3 className="mb-0 mt-5 font-[family-name:var(--font-display)] text-lg font-bold">🙋 Aksar Puche Jane Wale Sawal</h3>
      <div className="mt-2">
        {FAQS.map((f, i) => (
          <div key={f.q} className="mt-2 overflow-hidden rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)]">
            <button type="button" aria-expanded={openIdx === i} onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="flex w-full items-center justify-between gap-3 p-3.5 text-left font-extrabold">
              <span>{f.q}</span>
              <span className="shrink-0 text-[var(--accent-dark)]">{openIdx === i ? "−" : "+"}</span>
            </button>
            {openIdx === i && <p className="border-t border-dashed border-[var(--border)] p-3.5 text-sm leading-relaxed text-[var(--dim)]">{f.a}</p>}
          </div>
        ))}
      </div>

      <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">📞 Team Se Baat Karo</h3>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <a href="tel:+911800123456" className="rounded-[14px] bg-[var(--green)] py-3 text-center font-black text-white">📞 Call Karo</a>
        <a href="https://wa.me/911800123456?text=Namaste%20Fatafat%2C%20mujhe%20help%20chahiye" target="_blank" rel="noreferrer" className="rounded-[14px] bg-[#25D366] py-3 text-center font-black text-white">💬 WhatsApp</a>
        <a href="mailto:support@fatafat.app?subject=Fatafat%20Help" className="rounded-[14px] bg-[#1E140C] py-3 text-center font-black text-white">✉️ Email</a>
      </div>
      <p className="mt-1.5 text-center text-xs text-[var(--dim)]">Support timing: subah 8 baje — raat 10 baje, har din · Toll-free: 1800-123-456 · support@fatafat.app</p>

      <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">🆘 Problem Batao</h3>
      <p className="mt-1 text-[13px] text-[var(--dim)]">Ye form seedha store team ke paas jata hai (admin panel me dikhta hai). Galat item, late delivery, payment issue — kuch bhi likh do.</p>
      {sentId > 0 && (
        <div className="mt-3 rounded-[14px] border-[1.5px] border-[#A6D8AB] bg-[#EAF7EC] p-3.5 text-sm font-bold text-[#14532D]">
          ✅ Tumhari request #{sentId} save ho gayi hai! Team {mobile} par sampark karegi. Ek aur problem hai to neeche phir se likh sakte ho.
        </div>
      )}
      <label className="mt-3 block text-[13px] font-bold" htmlFor="helpName">Tumhara naam</label>
      <input id="helpName" {...FIELDS.submitSupportTicket.name} value={name} onChange={(e) => setName(e.target.value)} placeholder="Naam likho" className={inputCls} />
      <label className="mt-3 block text-[13px] font-bold" htmlFor="helpMobile">Mobile number (jis par team call kare)</label>
      <input id="helpMobile" {...FIELDS.submitSupportTicket.mobile} value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" inputMode="tel" className={inputCls} />
      <label className="mt-3 block text-[13px] font-bold" htmlFor="helpMsg">Problem kya hai?</label>
      <textarea id="helpMsg" {...FIELDS.submitSupportTicket.message} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Jaise: Mera order FF12345678 abhi tak nahi aaya…" rows={4} className={inputCls} />
      {formMsg && <p className="mt-1.5 text-[13px] font-bold text-[#B42318]">{formMsg}</p>}
      <button type="button" disabled={submit.isPending}
        onClick={() => {
          if (name.trim().length < 2) { setFormMsg("⚠ Apna naam likho"); return; }
          if (message.trim().length < 5) { setFormMsg("⚠ Problem thoda detail me likho (kam se kam 5 akshar)"); return; }
          submit.mutate();
        }}
        className="mt-3 w-full rounded-[14px] bg-[var(--accent)] py-3.5 font-black text-white disabled:opacity-60">
        {submit.isPending ? "Bhej rahe hain…" : "🆘 Problem Bhejo"}
      </button>
      <button type="button" onClick={props.onClose} className="mt-3 w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">Band Karo</button>
    </div>
  );
}

/* ================================================================== */
/* ADMIN PANEL — PIN login (server-verified) + token-gated management  */
/* ================================================================== */

type AdminTabId = "dashboard" | "products" | "orders" | "vendors" | "coupons" | "customers" | "support" | "activity" | "settings";
const ADMIN_TABS: { id: AdminTabId; label: string }[] = [
  { id: "dashboard", label: "📊 Dashboard" },
  { id: "products", label: "📦 Products" },
  { id: "orders", label: "🧾 Orders" },
  { id: "vendors", label: "🏪 Vendors" },
  { id: "coupons", label: "🎟️ Coupons" },
  { id: "customers", label: "👥 Customers" },
  { id: "support", label: "🆘 Support" },
  { id: "activity", label: "🛡️ Activity" },
  { id: "settings", label: "⚙️ Settings" },
];

function AdminExpired({ error, onExpired }: { error: string; onExpired: (m: string) => void }) {
  return (
    <div className="mt-4 rounded-[14px] border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] p-4 text-center">
      <p className="font-bold text-[#7A271A]">🔒 {error}</p>
      <button type="button" onClick={() => onExpired(error)} className="mt-3 rounded-xl bg-[#1E140C] px-4 py-2.5 font-black text-white">Phir Se Login Karo</button>
    </div>
  );
}

function AdminSheet(props: { onClose: () => void; showToast: (m: string) => void; onTrack: (id: string) => void }) {
  const [token, setToken] = useState<string>(() => {
    try { return sessionStorage.getItem("fatafat-admin-token") ?? ""; } catch { return ""; }
  });
  const [pin, setPin] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [lockSecs, setLockSecs] = useState(0);
  const [tab, setTab] = useState<AdminTabId>("dashboard");
  const [checked, setChecked] = useState(false);
  useCountdown(lockSecs, setLockSecs);

  const clearToken = () => {
    setToken("");
    try { sessionStorage.removeItem("fatafat-admin-token"); } catch { /* ignore */ }
  };
  const saveToken = (t: string) => {
    setToken(t);
    try { sessionStorage.setItem("fatafat-admin-token", t); } catch { /* storage blocked — token sirf memory me rahega */ }
  };
  const onExpired = (msg: string) => {
    clearToken();
    setLoginErr(msg || "Session expire ho gaya — phir se login karo.");
  };

  // Panel khulte hi purana token server se verify karo — expire ho to
  // seedha login screen dikhe, aadha-adhoora panel nahi.
  useEffect(() => {
    if (!token) { setChecked(true); return; }
    api.adminCheckSession({ token })
      .then((r) => {
        if (!r.valid) { clearToken(); setLoginErr("Session expire ho gaya tha (30 min inactivity) — phir se login karo."); }
        setChecked(true);
      })
      .catch(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useMutation({
    mutationFn: async () => await api.adminLogin({ pin }),
    onSuccess: (res) => {
      if (res.ok) {
        saveToken(res.token);
        setPin(""); setLoginErr(""); setTab("dashboard");
        props.showToast("🔐 Admin login ho gaya — welcome, Owner!");
      } else {
        setLoginErr(res.error);
        if (res.locked_seconds > 0) setLockSecs(res.locked_seconds);
      }
    },
    onError: (e) => setLoginErr(e instanceof Error ? e.message : "Login nahi hua"),
  });
  const logout = useMutation({
    mutationFn: async () => await api.adminLogout({ token }),
    onSettled: () => { clearToken(); props.showToast("🚪 Admin logout — session server se khatam ho gaya"); },
  });

  if (!checked) {
    return (
      <div>
        <SheetHead title="🔐 Admin Panel" onClose={props.onClose} />
        <p className="mt-4 text-sm text-[var(--dim)]">Session check ho raha hai…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div>
        <SheetHead title="🔐 Admin Panel" onClose={props.onClose} />
        <div className="mt-5 text-center">
          <div className="text-6xl">🛡️</div>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold">Owner Login</h3>
          <p className="mx-auto mt-1 max-w-[340px] text-sm leading-relaxed text-[var(--dim)]">
            Ye area sirf store owner ke liye hai. PIN <b className="text-[var(--text)]">server par verify</b> hota hai — galat PIN 5 baar daala to login 5 minute ke liye lock ho jata hai, aur har koshish Activity Log me record hoti hai.
          </p>
        </div>
        <label className="mt-5 block text-[13px] font-bold" htmlFor="adminPin">Admin PIN</label>
        <input id="adminPin" {...FIELDS.adminLogin.pin} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="••••" inputMode="numeric" type="password" autoComplete="off"
          className="mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-center text-xl font-black tracking-[0.4em]"
          onKeyDown={(e) => { if (e.key === "Enter" && pin.length >= 4 && lockSecs <= 0) login.mutate(); }} />
        {loginErr && <div className="mt-3 rounded-[14px] border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] p-3 text-sm font-bold text-[#7A271A]">⚠ {loginErr}</div>}
        {lockSecs > 0 && <p className="mt-2 text-center text-sm font-black text-[#B42318]">⏳ Login lock hai — {Math.floor(lockSecs / 60)}:{String(lockSecs % 60).padStart(2, "0")} baad phir try karo</p>}
        <button type="button" disabled={login.isPending || lockSecs > 0 || pin.length < 4} onClick={() => login.mutate()}
          className="mt-4 w-full rounded-[14px] bg-[#1E140C] py-3.5 text-base font-black text-white disabled:opacity-50">
          {login.isPending ? "Verify Ho Raha Hai…" : "🔐 Admin Login Karo"}
        </button>
        <p className="mt-3 rounded-xl bg-[#FFFBF6] p-3 text-center text-xs leading-relaxed text-[var(--dim)]">
          Apna admin PIN daalo — PIN sirf owner ko pata hota hai, aur hamesha server par verify hota hai. 5 baar galat PIN dala to login 5 minute ke liye lock ho jayega. Session 30 minute bina activity ke apne aap expire ho jata hai.
        </p>
        <button type="button" onClick={props.onClose} className="mt-3 w-full rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-3 font-black">Band Karo</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-tight">🔐 Admin Panel</h2>
          <p className="text-xs text-[var(--dim)]">Session live hai · 30 min inactivity par auto-expire · har action Activity Log me jata hai</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => logout.mutate()} disabled={logout.isPending}
            className="rounded-full border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] px-3.5 py-2.5 text-[13px] font-black text-[#B42318] disabled:opacity-60">🚪 Logout</button>
          <button type="button" aria-label="Band karo" onClick={props.onClose}
            className="grid h-[42px] w-[42px] place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-lg">✕</button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Admin sections">
        {ADMIN_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`rounded-full border-[1.5px] px-3 py-2 text-[13px] font-extrabold ${tab === t.id ? "border-[#1E140C] bg-[#1E140C] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "dashboard" && <AdminDashboardTab token={token} onExpired={onExpired} />}
      {tab === "products" && <AdminProductsTab token={token} showToast={props.showToast} onExpired={onExpired} />}
      {tab === "orders" && <AdminOrdersTab token={token} showToast={props.showToast} onTrack={props.onTrack} onExpired={onExpired} />}
      {tab === "vendors" && <AdminVendorsTab token={token} showToast={props.showToast} onExpired={onExpired} />}
      {tab === "coupons" && <AdminCouponsTab token={token} showToast={props.showToast} onExpired={onExpired} />}
      {tab === "customers" && <AdminCustomersTab token={token} onExpired={onExpired} />}
      {tab === "support" && <AdminSupportTab token={token} showToast={props.showToast} onExpired={onExpired} />}
      {tab === "activity" && <AdminActivityTab token={token} onExpired={onExpired} />}
      {tab === "settings" && (
        <AdminSettingsTab token={token} showToast={props.showToast} onExpired={onExpired}
          onPinChanged={() => { clearToken(); setLoginErr("🔑 PIN badal gaya — naye PIN se phir login karo."); }} />
      )}
    </div>
  );
}

function AdminDashboardTab({ token, onExpired }: { token: string; onExpired: (m: string) => void }) {
  const q = useQuery({ queryKey: ["admin", "dashboard", token], queryFn: () => api.adminDashboard({ token }), refetchInterval: 10000 });
  if (q.isPending) return <p className="mt-4 text-sm text-[var(--dim)]">Dashboard load ho raha hai…</p>;
  if (!q.data) return <p className="mt-4 text-sm text-[var(--dim)]">Data nahi aaya — phir try karo.</p>;
  if (!q.data.ok) return <AdminExpired error={q.data.error} onExpired={onExpired} />;
  const d = q.data;
  const cards: { label: string; value: string; sub: string; danger?: boolean }[] = [
    { label: "💰 Total Revenue", value: money(d.total_revenue), sub: "Cancelled orders hata kar, asli DB se" },
    { label: "🧾 Total Orders", value: String(d.total_orders), sub: `${d.pending_orders} packing queue me hain` },
    { label: "📦 Total Products", value: String(d.total_products), sub: "Live catalog items" },
    { label: "🏪 Total Vendors", value: String(d.total_vendors), sub: "Registered partner dukaanen" },
    { label: "⚠️ Low Stock", value: String(d.low_stock_count), sub: `${d.out_of_stock_count} items bilkul khatm (Out of Stock)`, danger: d.low_stock_count > 0 || d.out_of_stock_count > 0 },
    { label: "🪙 Coins Bahar Hain", value: String(d.coins_outstanding), sub: "Customers ke wallets me kul coins (= ₹ value)" },
  ];
  return (
    <div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--dim)]">{c.label}</span>
            <b className={`block font-[family-name:var(--font-display)] text-[26px] leading-tight ${c.danger ? "text-[#B42318]" : ""}`}>{c.value}</b>
            <span className="text-xs text-[var(--dim)]">{c.sub}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-[var(--dim)]">Ye saare numbers isi pal database se nikle hain. Products tab se price/stock badlo, Orders tab se kisi bhi order ka status badlo — sab kuch Activity Log me record hota hai.</p>
    </div>
  );
}

function AdminProductRow({ token, p, showToast, onExpired }: {
  token: string;
  p: Product;
  showToast: (m: string) => void;
  onExpired: (m: string) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(p.name);
  const [price, setPrice] = useState(String(p.price));
  const [mrp, setMrp] = useState(String(p.mrp));
  const [stock, setStock] = useState(String(p.stock));
  const [msg, setMsg] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const dirty = name !== p.name || Number(price) !== p.price || Number(mrp) !== p.mrp || Number(stock) !== p.stock;
  const save = useMutation({
    mutationFn: async () => await api.adminUpdateProduct({ token, product_id: p.id, name: name.trim(), price: Number(price), mrp: Number(mrp), stock: Number(stock) }),
    onSuccess: (res) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        void queryClient.invalidateQueries({ queryKey: ["staff"] });
        setMsg("✅ Save ho gaya — store par live hai");
        showToast(`✏️ "${name}" update ho gaya`);
      } else if (res.error.includes("session")) onExpired(res.error);
      else setMsg("⚠ " + res.error);
    },
    onError: (e) => setMsg("⚠ " + (e instanceof Error ? e.message : "Save nahi hua")),
  });
  const del = useMutation({
    mutationFn: async () => await api.adminDeleteProduct({ token, product_id: p.id }),
    onSuccess: (res) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        showToast(`🗑️ "${p.name}" catalog se delete ho gaya`);
      } else if (res.error.includes("session")) onExpired(res.error);
      else showToast("⚠ " + res.error);
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Delete nahi hua"),
  });
  const numCls = "w-full rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm font-bold";
  return (
    <div className="mt-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex items-center gap-2.5">
        <PImg p={p} alt="" className="h-[46px] w-[46px] shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <b className="block truncate text-sm">#{p.id} · {p.name}</b>
          <span className="text-xs text-[var(--dim)]">{p.brand} · {p.weight} · {p.source === "dark" ? "Dark Store" : `Partner: ${p.vendor}`} · ★ {p.rating}</span>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-black ${p.stock <= 0 ? "bg-[#FFF3F1] text-[#B42318]" : p.stock <= 5 ? "bg-[#FFF9E6] text-[#B54708]" : "bg-[#EAF7EC] text-[#14532D]"}`}>
          {p.stock <= 0 ? "OUT OF STOCK" : `Stock ${p.stock}`}
        </span>
      </div>
      <label className="sr-only" htmlFor={`apName${p.id}`}>Product naam</label>
      <input id={`apName${p.id}`} {...FIELDS.adminUpdateProduct.name} value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm font-bold" />
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] font-bold text-[var(--dim)]" htmlFor={`apPrice${p.id}`}>Price ₹</label>
          <input id={`apPrice${p.id}`} {...FIELDS.adminUpdateProduct.price} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className={numCls} />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[var(--dim)]" htmlFor={`apMrp${p.id}`}>MRP ₹</label>
          <input id={`apMrp${p.id}`} {...FIELDS.adminUpdateProduct.mrp} value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="numeric" className={numCls} />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[var(--dim)]" htmlFor={`apStock${p.id}`}>Stock</label>
          <input id={`apStock${p.id}`} {...FIELDS.adminUpdateProduct.stock} value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" className={numCls} />
        </div>
      </div>
      {msg && <p className="mt-1.5 text-xs font-bold">{msg}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={!dirty || save.isPending}
          onClick={() => {
            if (name.trim().length < 3 || !(Number(price) >= 1) || !(Number(mrp) >= 1) || !(Number(stock) >= 0)) { setMsg("⚠ Naam, price, MRP aur stock sahi se bharo"); return; }
            save.mutate();
          }}
          className="flex-1 rounded-xl bg-[var(--green)] py-2.5 text-sm font-black text-white disabled:opacity-40">
          {save.isPending ? "Save ho raha…" : dirty ? "💾 Save Karo" : "✓ Saved Hai"}
        </button>
        {confirmDel ? (
          <>
            <button type="button" disabled={del.isPending} onClick={() => del.mutate()} className="flex-1 rounded-xl bg-[#D92D20] py-2.5 text-sm font-black text-white disabled:opacity-60">Pakka Delete?</button>
            <button type="button" onClick={() => setConfirmDel(false)} className="rounded-xl border-[1.5px] border-[var(--border)] px-3 text-sm font-black">Nahi</button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirmDel(true)} className="rounded-xl border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] px-3.5 py-2.5 text-sm font-black text-[#B42318]">🗑️ Delete</button>
        )}
      </div>
    </div>
  );
}

function AdminProductsTab({ token, showToast, onExpired }: { token: string; showToast: (m: string) => void; onExpired: (m: string) => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["admin", "products", token, search],
    queryFn: () => api.adminListProducts({ token, query: search }),
  });
  const [nName, setNName] = useState("");
  const [nWeight, setNWeight] = useState("");
  const [nBrand, setNBrand] = useState("");
  const [nPrice, setNPrice] = useState("");
  const [nMrp, setNMrf] = useState("");
  const [nStock, setNStock] = useState("20");
  const [nCat, setNCat] = useState<"snacks" | "grocery" | "dairy" | "drinks" | "care" | "fruits" | "bakery" | "chocolates" | "babypet" | "frozen">("snacks");
  const [nMsg, setNMsg] = useState("");
  const add = useMutation({
    mutationFn: async () => await api.adminAddProduct({ token, name: nName.trim(), weight: nWeight.trim(), price: Number(nPrice), mrp: Number(nMrp), category: nCat, brand: nBrand.trim(), stock: Number(nStock) }),
    onSuccess: (res) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        setNMsg(`✅ "${nName}" live catalog me add ho gaya (ID ${res.id})`);
        setNName(""); setNWeight(""); setNBrand(""); setNPrice(""); setNMrf("");
      } else if (res.error.includes("session")) onExpired(res.error);
      else setNMsg("⚠ " + res.error);
    },
    onError: (e) => setNMsg("⚠ " + (e instanceof Error ? e.message : "Add nahi hua")),
  });
  const inputCls = "mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm";
  return (
    <div>
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <b className="font-[family-name:var(--font-display)] text-base">➕ Naya Product Add Karo (Admin)</b>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="mt-2 block text-[12px] font-bold" htmlFor="npName">Product naam</label>
            <input id="npName" {...FIELDS.adminAddProduct.name} value={nName} onChange={(e) => setNName(e.target.value)} placeholder="Jaise: Special Kaju Katli" className={inputCls} />
          </div>
          <div>
            <label className="mt-2 block text-[12px] font-bold" htmlFor="npWeight">Weight</label>
            <input id="npWeight" {...FIELDS.adminAddProduct.weight} value={nWeight} onChange={(e) => setNWeight(e.target.value)} placeholder="500 g" className={inputCls} />
          </div>
          <div>
            <label className="mt-2 block text-[12px] font-bold" htmlFor="npBrand">Brand</label>
            <input id="npBrand" {...FIELDS.adminAddProduct.brand} value={nBrand} onChange={(e) => setNBrand(e.target.value)} placeholder="Brand naam" className={inputCls} />
          </div>
          <div>
            <label className="mt-2 block text-[12px] font-bold" htmlFor="npPrice">Price ₹</label>
            <input id="npPrice" {...FIELDS.adminAddProduct.price} value={nPrice} onChange={(e) => setNPrice(e.target.value)} placeholder="99" inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className="mt-2 block text-[12px] font-bold" htmlFor="npMrp">MRP ₹</label>
            <input id="npMrp" {...FIELDS.adminAddProduct.mrp} value={nMrp} onChange={(e) => setNMrf(e.target.value)} placeholder="120" inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className="mt-2 block text-[12px] font-bold" htmlFor="npStock">Stock</label>
            <input id="npStock" {...FIELDS.adminAddProduct.stock} value={nStock} onChange={(e) => setNStock(e.target.value)} placeholder="20" inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className="mt-2 block text-[12px] font-bold" htmlFor="npCat">Category</label>
            <select id="npCat" value={nCat} onChange={(e) => setNCat(e.target.value as typeof nCat)} className={inputCls}>
              {CATS.slice(1).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        {nMsg && <p className="mt-2 text-[13px] font-bold">{nMsg}</p>}
        <button type="button" disabled={add.isPending}
          onClick={() => {
            if (nName.trim().length < 3 || nWeight.trim().length < 2 || nBrand.trim().length < 2 || !(Number(nPrice) > 0) || !(Number(nMrp) > 0)) { setNMsg("⚠ Naam, weight, brand, price aur MRP sahi se bharo"); return; }
            add.mutate();
          }}
          className="mt-3 w-full rounded-[14px] bg-[#1E140C] py-3 font-black text-white disabled:opacity-60">+ Product Live Karo</button>
      </div>

      <label className="sr-only" htmlFor="adminProdSearch">Products search karo</label>
      <input id="adminProdSearch" {...FIELDS.adminListProducts.query} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Product search karo — naam, brand, category…"
        className="mt-4 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]" />
      {q.isPending ? <p className="mt-3 text-sm text-[var(--dim)]">Products load ho rahe hain…</p>
        : !q.data ? <p className="mt-3 text-sm text-[var(--dim)]">Data nahi aaya.</p>
        : !q.data.ok ? <AdminExpired error={q.data.error} onExpired={onExpired} />
        : q.data.products.length === 0 ? <p className="mt-3 text-sm text-[var(--dim)]">"{search}" ke liye koi product nahi mila.</p>
        : q.data.products.map((p) => <AdminProductRow key={p.id} token={token} p={p} showToast={showToast} onExpired={onExpired} />)}
    </div>
  );
}

function AdminOrdersTab({ token, showToast, onTrack, onExpired }: { token: string; showToast: (m: string) => void; onTrack: (id: string) => void; onExpired: (m: string) => void }) {
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "orders", token], queryFn: () => api.adminListOrders({ token, limit: 100 }), refetchInterval: 8000 });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusPick, setStatusPick] = useState<Record<string, string>>({});
  const setStatus = useMutation({
    mutationFn: async (v: { orderId: string; status: "placed" | "packing" | "on_the_way" | "delivered" | "cancelled" }) =>
      await api.adminSetOrderStatus({ token, order_id: v.orderId, status: v.status }),
    onSuccess: (res, v) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        void queryClient.invalidateQueries({ queryKey: ["staff"] });
        showToast(`🔄 Order ${v.orderId} ka status badal gaya`);
      } else if (res.error.includes("session")) onExpired(res.error);
      else showToast("⚠ " + res.error);
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Status nahi badla"),
  });
  if (q.isPending) return <p className="mt-4 text-sm text-[var(--dim)]">Orders load ho rahe hain…</p>;
  if (!q.data) return <p className="mt-4 text-sm text-[var(--dim)]">Data nahi aaya.</p>;
  if (!q.data.ok) return <AdminExpired error={q.data.error} onExpired={onExpired} />;
  return (
    <div>
      <p className="mt-3 text-[13px] text-[var(--dim)]">Saare customers ke orders — status badlo to customer ki tracking turant badal jayegi. Cancel karne par stock + coins wapas ho jate hain.</p>
      {q.data.orders.length === 0 ? <p className="mt-3 text-sm text-[var(--dim)]">Abhi koi order nahi hai.</p> :
        q.data.orders.map((o) => {
          const pick = statusPick[o.id] ?? o.status;
          return (
            <div key={o.id} className="mt-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3.5">
              <b className="flex flex-wrap justify-between gap-2">
                <span>{o.id}</span>
                <span className={o.status === "cancelled" ? "text-[#B42318]" : o.status === "delivered" ? "text-[var(--green)]" : "text-[var(--accent-dark)]"}>{o.status_label}</span>
              </b>
              <div className="mt-0.5 text-[13px] text-[var(--dim)]">
                👤 {o.customer_name} · {o.phone} · {o.items_count} items · <b className="text-[var(--text)]">{money(o.grand_total)}</b> · {fmtDateTime(o.created_at)}
                <br />📍 {o.area_name} · 🕐 {o.delivery_slot} · 💳 {o.payment_detail || o.payment_method}
                {o.coupon_code ? <> · 🎟️ {o.coupon_code}</> : null}
                {o.is_gift ? <><br />🎁 GIFT — {o.gift_name} ({o.gift_phone})</> : null}
              </div>
              <button type="button" onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="mt-1.5 text-[13px] font-black text-[var(--accent-dark)]">
                {expanded === o.id ? "Items chhupao ▴" : "Items dekho ▾"}
              </button>
              {expanded === o.id && (
                <div className="mt-1.5 rounded-xl bg-[var(--bg)] p-2.5">
                  {o.items.map((i) => (
                    <div key={i.product_id} className="flex justify-between py-0.5 text-[13px]"><span>{i.name} ({i.weight}) × {i.qty}</span><span>{money(i.price * i.qty)}</span></div>
                  ))}
                  <div className="mt-1 flex justify-between border-t border-dashed border-[var(--border)] pt-1.5 text-[13px] font-bold"><span>Total (delivery {o.delivery_fee === 0 ? "FREE" : money(o.delivery_fee)}{o.discount > 0 ? `, coupon −${money(o.discount)}` : ""})</span><span>{money(o.grand_total)}</span></div>
                  {o.instructions && <p className="mt-1 text-xs text-[var(--dim)]">🔔 {o.instructions}</p>}
                </div>
              )}
              <div className="mt-2.5 flex gap-2">
                <label className="sr-only" htmlFor={`st-${o.id}`}>Order {o.id} ka status</label>
                <select id={`st-${o.id}`} value={pick} onChange={(e) => setStatusPick((prev) => ({ ...prev, [o.id]: e.target.value }))}
                  className="min-w-0 flex-1 rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-2.5 py-2.5 text-sm font-bold">
                  <option value="placed">✅ Order Mil Gaya</option>
                  <option value="packing">📦 Packing Ho Rahi Hai</option>
                  <option value="on_the_way">🛵 Rider Raste Me Hai</option>
                  <option value="delivered">🎉 Delivered</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
                <button type="button" disabled={setStatus.isPending || pick === o.status}
                  onClick={() => setStatus.mutate({ orderId: o.id, status: pick as "placed" | "packing" | "on_the_way" | "delivered" | "cancelled" })}
                  className="rounded-xl bg-[#1E140C] px-3.5 font-black text-white disabled:opacity-40">Lagao</button>
                <button type="button" onClick={() => onTrack(o.id)} className="rounded-xl border-[1.5px] border-[var(--border)] px-3 font-black">Track</button>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function AdminVendorsTab({ token, showToast, onExpired }: { token: string; showToast: (m: string) => void; onExpired: (m: string) => void }) {
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "vendors", token], queryFn: () => api.adminListVendors({ token }) });
  const [confirmId, setConfirmId] = useState(0);
  const setV = useMutation({
    mutationFn: async (v: { id: number; status: "approved" | "removed"; shop: string }) =>
      await api.adminSetVendorStatus({ token, vendor_id: v.id, status: v.status }),
    onSuccess: (res, v) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["admin", "vendors"] });
        void queryClient.invalidateQueries({ queryKey: ["vendors"] });
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        setConfirmId(0);
        showToast(v.status === "approved" ? `✅ "${v.shop}" approve ho gaya` : `🗑️ "${v.shop}" remove ho gaya — unke products bhi catalog se hate`);
      } else if (res.error.includes("session")) onExpired(res.error);
      else showToast("⚠ " + res.error);
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Nahi hua"),
  });
  if (q.isPending) return <p className="mt-4 text-sm text-[var(--dim)]">Vendors load ho rahe hain…</p>;
  if (!q.data) return <p className="mt-4 text-sm text-[var(--dim)]">Data nahi aaya.</p>;
  if (!q.data.ok) return <AdminExpired error={q.data.error} onExpired={onExpired} />;
  return (
    <div>
      <p className="mt-3 text-[13px] text-[var(--dim)]">Staff panel se khud register hui dukaanen yaha dikhti hain. Remove karne par vendor ki registration aur unke add kiye hue catalog products delete ho jate hain. (Sharma / Gupta / City Care jaise seed partner stores catalog ka hissa hain.)</p>
      {q.data.vendors.length === 0 ? <p className="mt-3 text-sm text-[var(--dim)]">Abhi koi registered vendor nahi — Staff Panel → "Vendor Bano" se pehli dukaan register karke dekho.</p> :
        q.data.vendors.map((v) => (
          <div key={v.id} className="mt-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3.5">
            <b className="flex flex-wrap justify-between gap-2">
              <span>🏪 {v.shop_name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${v.status === "approved" ? "bg-[#EAF7EC] text-[#14532D]" : "bg-[#FFF9E6] text-[#B54708]"}`}>{v.status === "approved" ? "✓ APPROVED" : v.status.toUpperCase()}</span>
            </b>
            <div className="mt-0.5 text-[13px] text-[var(--dim)]">👤 {v.owner_name} · 📱 {v.phone} · 📍 {v.area} · 📦 Catalog me {v.product_count} products · {fmtDateTime(v.created_at)}</div>
            <div className="mt-2.5 flex gap-2">
              {v.status !== "approved" && (
                <button type="button" disabled={setV.isPending} onClick={() => setV.mutate({ id: v.id, status: "approved", shop: v.shop_name })}
                  className="flex-1 rounded-xl bg-[var(--green)] py-2.5 text-sm font-black text-white disabled:opacity-60">✅ Approve Karo</button>
              )}
              {confirmId === v.id ? (
                <>
                  <button type="button" disabled={setV.isPending} onClick={() => setV.mutate({ id: v.id, status: "removed", shop: v.shop_name })}
                    className="flex-1 rounded-xl bg-[#D92D20] py-2.5 text-sm font-black text-white disabled:opacity-60">Pakka Remove?</button>
                  <button type="button" onClick={() => setConfirmId(0)} className="rounded-xl border-[1.5px] border-[var(--border)] px-3 text-sm font-black">Nahi</button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmId(v.id)} className="flex-1 rounded-xl border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] py-2.5 text-sm font-black text-[#B42318]">🗑️ Vendor Remove Karo</button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

function AdminCouponsTab({ token, showToast, onExpired }: { token: string; showToast: (m: string) => void; onExpired: (m: string) => void }) {
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "coupons", token], queryFn: () => api.adminListCoupons({ token }) });
  const [confirmKey, setConfirmKey] = useState("");
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    void queryClient.invalidateQueries({ queryKey: ["vendorCoupons"] });
  };
  const toggle = useMutation({
    mutationFn: async (v: { kind: "platform" | "vendor"; code: string; couponId: number; enabled: boolean }) =>
      await api.adminToggleCoupon({ token, kind: v.kind, code: v.code, coupon_id: v.couponId, enabled: v.enabled }),
    onSuccess: (res, v) => {
      if (res.ok) { invalidate(); showToast(`🎟️ Coupon ${v.enabled ? "ON" : "OFF"} ho gaya — cart me turant asar padega`); }
      else if (res.error.includes("session")) onExpired(res.error);
      else showToast("⚠ " + res.error);
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Toggle nahi hua"),
  });
  const del = useMutation({
    mutationFn: async (v: { kind: "platform" | "vendor"; code: string; couponId: number }) =>
      await api.adminDeleteCoupon({ token, kind: v.kind, code: v.code, coupon_id: v.couponId }),
    onSuccess: (res, v) => {
      if (res.ok) { invalidate(); setConfirmKey(""); showToast(`🗑️ Coupon ${v.code || ""} delete ho gaya`); }
      else if (res.error.includes("session")) onExpired(res.error);
      else showToast("⚠ " + res.error);
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Delete nahi hua"),
  });
  if (q.isPending) return <p className="mt-4 text-sm text-[var(--dim)]">Coupons load ho rahe hain…</p>;
  if (!q.data) return <p className="mt-4 text-sm text-[var(--dim)]">Data nahi aaya.</p>;
  if (!q.data.ok) return <AdminExpired error={q.data.error} onExpired={onExpired} />;
  const row = (key: string, title: string, sub: string, enabled: boolean, onToggle: () => void, onDelete: () => void) => (
    <div key={key} className={`mt-2.5 flex items-center gap-3 rounded-[14px] border-[1.5px] p-3.5 ${enabled ? "border-dashed border-[#FF9A5C] bg-[#FFFBF6]" : "border-[var(--border)] bg-[var(--surface)] opacity-70"}`}>
      <div className="min-w-0 flex-1">
        <b className="block text-sm">🎟️ {title}</b>
        <span className="text-xs text-[var(--dim)]">{sub} · {enabled ? "🟢 LIVE — cart me chal raha hai" : "🔴 BAND — cart me nahi chalega"}</span>
      </div>
      <button type="button" disabled={toggle.isPending} onClick={onToggle}
        className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-black disabled:opacity-60 ${enabled ? "bg-[#D92D20] text-white" : "bg-[var(--green)] text-white"}`}>
        {enabled ? "OFF Karo" : "ON Karo"}
      </button>
      {confirmKey === key ? (
        <button type="button" disabled={del.isPending} onClick={onDelete} className="shrink-0 rounded-full bg-[#1E140C] px-3 py-2 text-[13px] font-black text-white disabled:opacity-60">Pakka?</button>
      ) : (
        <button type="button" aria-label={`${title} delete karo`} onClick={() => setConfirmKey(key)} className="shrink-0 rounded-full border-[1.5px] border-[#F3B7B0] bg-[#FFF3F1] px-3 py-2 text-[13px] font-black text-[#B42318]">🗑️</button>
      )}
    </div>
  );
  return (
    <div>
      <h3 className="mb-0 mt-4 font-[family-name:var(--font-display)] text-lg font-bold">🏷️ Fatafat Platform Coupons</h3>
      {q.data.platform.map((c) => row(`p-${c.code}`, `${c.code} — ₹${c.off} OFF`, `${money(c.min_order)}+ ke order par · ${c.label}`, c.enabled,
        () => toggle.mutate({ kind: "platform", code: c.code, couponId: 0, enabled: !c.enabled }),
        () => del.mutate({ kind: "platform", code: c.code, couponId: 0 })))}
      {q.data.platform.length === 0 && <p className="mt-2 text-sm text-[var(--dim)]">Koi platform coupon nahi bacha (sab delete ho gaye).</p>}
      <h3 className="mb-0 mt-6 font-[family-name:var(--font-display)] text-lg font-bold">🏪 Vendor Coupons</h3>
      {q.data.vendor.map((c) => row(`v-${c.id}`, `${c.code} — ₹${c.off} OFF`, `${money(c.min_order)}+ ke order par · ${c.vendor_name}`, c.enabled,
        () => toggle.mutate({ kind: "vendor", code: "", couponId: c.id, enabled: !c.enabled }),
        () => del.mutate({ kind: "vendor", code: c.code, couponId: c.id })))}
      {q.data.vendor.length === 0 && <p className="mt-2 text-sm text-[var(--dim)]">Abhi koi vendor coupon nahi — Staff Panel se vendor apna coupon bana sakta hai.</p>}
    </div>
  );
}

function AdminCustomersTab({ token, onExpired }: { token: string; onExpired: (m: string) => void }) {
  const q = useQuery({ queryKey: ["admin", "customers", token], queryFn: () => api.adminCustomers({ token }) });
  if (q.isPending) return <p className="mt-4 text-sm text-[var(--dim)]">Customers load ho rahe hain…</p>;
  if (!q.data) return <p className="mt-4 text-sm text-[var(--dim)]">Data nahi aaya.</p>;
  if (!q.data.ok) return <AdminExpired error={q.data.error} onExpired={onExpired} />;
  const d = q.data;
  return (
    <div>
      <div className="mt-4 rounded-2xl border-[1.5px] border-[#F2C94C] bg-[#FFF9E6] p-4">
        <b className="block">👤 Guest / Demo Account — {d.profile.name}</b>
        <span className="text-[13px] text-[var(--dim)]">📱 {d.profile.phone} · 🪙 Wallet: <b className="text-[var(--text)]">{d.profile.coins} coins</b> · 🎁 Referral code: <b className="text-[var(--text)]">{d.profile.referral_code || "—"}</b>{d.profile.referred_by ? ` · Dost ke code (${d.profile.referred_by}) se bonus liya` : ""}</span>
      </div>
      <h3 className="mb-0 mt-5 font-[family-name:var(--font-display)] text-lg font-bold">👥 Saare Accounts ({d.customers.length})</h3>
      {d.customers.map((c) => (
        <div key={c.phone + c.name} className="mt-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3.5">
          <b className="flex justify-between gap-2"><span>{c.name}</span><span>{money(c.spent)} kharch</span></b>
          <div className="mt-0.5 text-[13px] text-[var(--dim)]">📱 {c.phone} · 🧾 {c.orders} orders · Aakhri order: {fmtDateTime(c.last_order_at)}</div>
        </div>
      ))}
      <h3 className="mb-0 mt-5 font-[family-name:var(--font-display)] text-lg font-bold">🧾 Recent Orders (Sab Accounts)</h3>
      {d.recent_orders.length === 0 ? <p className="mt-2 text-sm text-[var(--dim)]">Abhi koi order nahi.</p> :
        d.recent_orders.slice(0, 10).map((o) => (
          <div key={o.id} className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px]">
            <span className="min-w-0 flex-1 truncate"><b>{o.id}</b> · {o.customer_name} · {o.items_count} items</span>
            <span className="shrink-0 font-bold">{money(o.grand_total)}</span>
            <span className={`shrink-0 font-black ${o.status === "cancelled" ? "text-[#B42318]" : o.status === "delivered" ? "text-[var(--green)]" : "text-[var(--accent-dark)]"}`}>{o.status_label}</span>
          </div>
        ))}
    </div>
  );
}

function AdminSupportTab({ token, showToast, onExpired }: { token: string; showToast: (m: string) => void; onExpired: (m: string) => void }) {
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "tickets", token], queryFn: () => api.adminListTickets({ token, limit: 100 }), refetchInterval: 10000 });
  const setT = useMutation({
    mutationFn: async (v: { id: number; status: "open" | "resolved" }) =>
      await api.adminSetTicketStatus({ token, ticket_id: v.id, status: v.status }),
    onSuccess: (res, v) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
        showToast(v.status === "resolved" ? `✅ Request #${v.id} resolved` : `↩ Request #${v.id} phir open`);
      } else if (res.error.includes("session")) onExpired(res.error);
      else showToast("⚠ " + res.error);
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Status nahi badla"),
  });
  if (q.isPending) return <p className="mt-4 text-sm text-[var(--dim)]">Support requests load ho rahi hain…</p>;
  if (!q.data) return <p className="mt-4 text-sm text-[var(--dim)]">Data nahi aaya.</p>;
  if (!q.data.ok) return <AdminExpired error={q.data.error} onExpired={onExpired} />;
  const open = q.data.tickets.filter((t) => t.status === "open");
  return (
    <div>
      <p className="mt-3 text-[13px] text-[var(--dim)]">Help page se aayi hui problems — <b className="text-[var(--text)]">{open.length} open</b>, {q.data.tickets.length - open.length} resolved. Customer ko unke number par call/WhatsApp karke jawab do, phir Resolved mark karo.</p>
      {q.data.tickets.length === 0 ? <p className="mt-3 text-sm text-[var(--dim)]">Abhi koi support request nahi — Help page se pehli problem aate hi yaha dikhegi.</p> :
        q.data.tickets.map((t) => (
          <div key={t.id} className={`mt-2.5 rounded-[14px] border-[1.5px] p-3.5 ${t.status === "open" ? "border-[#FFB59A] bg-[#FFF7EE]" : "border-[var(--border)] bg-[var(--surface)] opacity-75"}`}>
            <b className="flex flex-wrap justify-between gap-2">
              <span>#{t.id} · {t.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${t.status === "open" ? "bg-[#FFE0C7] text-[#8A3A00]" : "bg-[#EAF7EC] text-[#14532D]"}`}>{t.status === "open" ? "🟠 OPEN" : "✅ RESOLVED"}</span>
            </b>
            <p className="mt-1 text-sm leading-relaxed">{t.message}</p>
            <div className="mt-1 text-xs text-[var(--dim)]">📱 {t.mobile} · {fmtDateTime(t.created_at)}</div>
            <div className="mt-2.5 flex gap-2">
              <a href={`tel:${t.mobile.replace(/\s/g, "")}`} className="rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm font-black">📞 Call</a>
              {t.status === "open" ? (
                <button type="button" disabled={setT.isPending} onClick={() => setT.mutate({ id: t.id, status: "resolved" })}
                  className="flex-1 rounded-xl bg-[var(--green)] py-2.5 text-sm font-black text-white disabled:opacity-60">✅ Resolved Mark Karo</button>
              ) : (
                <button type="button" disabled={setT.isPending} onClick={() => setT.mutate({ id: t.id, status: "open" })}
                  className="flex-1 rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] py-2.5 text-sm font-black disabled:opacity-60">↩ Phir Open Karo</button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

function AdminActivityTab({ token, onExpired }: { token: string; onExpired: (m: string) => void }) {
  const q = useQuery({ queryKey: ["admin", "activity", token], queryFn: () => api.adminActivityLog({ token, limit: 100 }), refetchInterval: 10000 });
  if (q.isPending) return <p className="mt-4 text-sm text-[var(--dim)]">Activity log load ho raha hai…</p>;
  if (!q.data) return <p className="mt-4 text-sm text-[var(--dim)]">Data nahi aaya.</p>;
  if (!q.data.ok) return <AdminExpired error={q.data.error} onExpired={onExpired} />;
  const dangerKinds = ["login_failed", "login_locked", "login_blocked", "pin_change_failed", "customer_login_failed", "customer_login_locked"];
  return (
    <div>
      <p className="mt-3 text-[13px] leading-relaxed text-[var(--dim)]">
        🛡️ <b className="text-[var(--text)]">Security record:</b> har admin login, <b className="text-[#B42318]">galat PIN ki koshish (time ke saath)</b>, lockout, product edit/delete, order status, settings aur PIN change — sab yaha record hota hai. Lal wali entries par khaas dhyaan do: wahi hack koshishon ke nishaan hain.
      </p>
      {q.data.entries.length === 0 ? <p className="mt-3 text-sm text-[var(--dim)]">Abhi log khaali hai.</p> :
        q.data.entries.map((e) => {
          const danger = dangerKinds.includes(e.kind);
          const good = e.kind === "login_success";
          return (
            <div key={e.id} className={`mt-2 rounded-xl border-[1.5px] px-3 py-2.5 text-[13px] ${danger ? "border-[#F3B7B0] bg-[#FFF3F1]" : good ? "border-[#A6D8AB] bg-[#EAF7EC]" : "border-[var(--border)] bg-[var(--surface)]"}`}>
              <span className="leading-relaxed">{e.detail}</span>
              <span className="mt-0.5 block text-xs font-bold text-[var(--dim)]">🕐 {fmtDateTime(e.created_at)} · {e.kind}</span>
            </div>
          );
        })}
    </div>
  );
}

function AdminSettingsTab({ token, showToast, onExpired, onPinChanged }: {
  token: string;
  showToast: (m: string) => void;
  onExpired: (m: string) => void;
  onPinChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "settings", token], queryFn: () => api.adminGetSettings({ token }) });
  const [charge, setCharge] = useState("");
  const [threshold, setThreshold] = useState("");
  const [geofence, setGeofence] = useState("");
  const [setMsg, setSetMsg] = useState("");
  useEffect(() => {
    if (q.data?.ok) {
      setCharge(String(q.data.delivery_charge));
      setThreshold(String(q.data.free_threshold));
      setGeofence(String(q.data.geofence_km));
    }
  }, [q.data]);
  const save = useMutation({
    mutationFn: async () => await api.adminUpdateSettings({ token, delivery_charge: Number(charge), free_threshold: Number(threshold), geofence_km: Number(geofence) }),
    onSuccess: (res) => {
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
        void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
        setSetMsg("✅ Settings save ho gayi — checkout aur areas par turant live hain");
        showToast("⚙️ Store settings badal gayi");
      } else if (res.error.includes("session")) onExpired(res.error);
      else setSetMsg("⚠ " + res.error);
    },
    onError: (e) => setSetMsg("⚠ " + (e instanceof Error ? e.message : "Save nahi hua")),
  });
  const [curPin, setCurPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const changePin = useMutation({
    mutationFn: async () => await api.adminChangePin({ token, current_pin: curPin, new_pin: newPin }),
    onSuccess: (res) => {
      if (res.ok) {
        showToast("🔑 Admin PIN badal gaya — naye PIN se phir login karo");
        onPinChanged();
      } else if (res.error.includes("session")) onExpired(res.error);
      else setPinMsg("⚠ " + res.error);
    },
    onError: (e) => setPinMsg("⚠ " + (e instanceof Error ? e.message : "PIN change nahi hua")),
  });
  const backup = useMutation({
    mutationFn: async () => await api.adminBackup({ token }),
    onSuccess: (res) => {
      if (!res.ok) {
        if (res.error.includes("session")) onExpired(res.error);
        else showToast("⚠ " + res.error);
        return;
      }
      try {
        const url = URL.createObjectURL(new Blob([res.json], { type: "application/json" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        showToast("💾 Backup download ho gaya — file ko safe jagah rakho");
      } catch {
        showToast("Download is browser me block hai — phir try karo");
      }
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Backup nahi bana"),
  });
  const inputCls = "mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-3 text-[15px]";
  if (q.isPending) return <p className="mt-4 text-sm text-[var(--dim)]">Settings load ho rahi hain…</p>;
  if (q.data && !q.data.ok) return <AdminExpired error={q.data.error} onExpired={onExpired} />;
  return (
    <div>
      <h3 className="mb-0 mt-4 font-[family-name:var(--font-display)] text-lg font-bold">⚙️ Store Settings</h3>
      <p className="mt-1 text-[13px] text-[var(--dim)]">Ye values server par save hoti hain aur checkout ki delivery fees + area geofencing turant inhi se chalte hain — client par koi hisaab trust nahi hota.</p>
      <label className="mt-3 block text-[13px] font-bold" htmlFor="setCharge">Delivery charge (₹) — free threshold se kam par</label>
      <input id="setCharge" {...FIELDS.adminUpdateSettings.delivery_charge} value={charge} onChange={(e) => setCharge(e.target.value)} inputMode="numeric" className={inputCls} />
      <label className="mt-3 block text-[13px] font-bold" htmlFor="setThreshold">Free delivery threshold (₹) — isse zyada par delivery FREE</label>
      <input id="setThreshold" {...FIELDS.adminUpdateSettings.free_threshold} value={threshold} onChange={(e) => setThreshold(e.target.value)} inputMode="numeric" className={inputCls} />
      <label className="mt-3 block text-[13px] font-bold" htmlFor="setGeo">Geofence radius (km) — isse door wale areas me delivery band</label>
      <input id="setGeo" {...FIELDS.adminUpdateSettings.geofence_km} value={geofence} onChange={(e) => setGeofence(e.target.value)} inputMode="decimal" className={inputCls} />
      {setMsg && <p className="mt-2 text-[13px] font-bold">{setMsg}</p>}
      <button type="button" disabled={save.isPending}
        onClick={() => {
          if (!(Number(charge) >= 0) || !(Number(threshold) >= 0) || !(Number(geofence) >= 0.5)) { setSetMsg("⚠ Teeno values sahi se bharo (radius kam se kam 0.5 km)"); return; }
          save.mutate();
        }}
        className="mt-3 w-full rounded-[14px] bg-[var(--accent)] py-3 font-black text-white disabled:opacity-60">💾 Settings Save Karo</button>

      <h3 className="mb-0 mt-7 font-[family-name:var(--font-display)] text-lg font-bold">🔑 Admin PIN Badlo</h3>
      <p className="mt-1 text-[13px] text-[var(--dim)]">PIN badalte hi saare admin sessions khatam ho jayenge — naye PIN se phir login karna hoga (yahi asli security hai).</p>
      <label className="mt-3 block text-[13px] font-bold" htmlFor="curPin">Abhi wala (current) PIN</label>
      <input id="curPin" {...FIELDS.adminChangePin.current_pin} value={curPin} onChange={(e) => setCurPin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" type="password" autoComplete="off" className={inputCls} />
      <label className="mt-3 block text-[13px] font-bold" htmlFor="newPin">Naya PIN (4–6 digit)</label>
      <input id="newPin" {...FIELDS.adminChangePin.new_pin} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" type="password" autoComplete="off" className={inputCls} />
      {pinMsg && <p className="mt-2 text-[13px] font-bold text-[#B42318]">{pinMsg}</p>}
      <button type="button" disabled={changePin.isPending}
        onClick={() => {
          if (!/^\d{4,6}$/.test(curPin) || !/^\d{4,6}$/.test(newPin)) { setPinMsg("⚠ Dono PIN 4–6 digit ke numbers rakho"); return; }
          changePin.mutate();
        }}
        className="mt-3 w-full rounded-[14px] bg-[#1E140C] py-3 font-black text-white disabled:opacity-60">🔑 PIN Badlo (Phir Login Karna Hoga)</button>

      <h3 className="mb-0 mt-7 font-[family-name:var(--font-display)] text-lg font-bold">💾 Data Backup</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--dim)]">Poore store ka ek JSON backup download karo — products, orders, vendors, coupons, accounts aur settings. Kabhi kuch gadbad ho jaye to yahi file se data pehchana aur wapas laya ja sakta hai. Backup lena bhi Activity Log me record hota hai.</p>
      <button type="button" disabled={backup.isPending} onClick={() => backup.mutate()}
        className="mt-3 w-full rounded-[14px] border-[1.5px] border-[var(--green)] bg-[var(--green-bg)] py-3 font-black text-[var(--green)] disabled:opacity-60">
        {backup.isPending ? "Backup Ban Raha Hai…" : "⬇️ Poora Data Backup Download Karo (JSON)"}
      </button>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[13px] leading-relaxed">
        <b>🛡️ Security kaise kaam karti hai</b>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[var(--dim)]">
          <li>Admin PIN sirf server par salted hash me rehta hai — app ke code me PIN kahin nahi hai.</li>
          <li>Har admin action se pehle server session token check karta hai; bina token ke koi admin kaam nahi hota.</li>
          <li>Session 30 minute bina activity ke apne aap expire ho jata hai.</li>
          <li>5 galat PIN = 5 minute lock, aur har galat koshish Activity Log me time ke saath dikhti hai.</li>
          <li>Saare paiso ke hisaab (price, total, discount, coins) sirf server par bante hain — browser jo bheje, server DB se hi gin-ta hai.</li>
        </ul>
      </div>
    </div>
  );
}
