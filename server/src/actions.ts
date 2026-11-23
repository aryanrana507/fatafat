// Fatafat Full App — server actions.
// All state (catalog, stock, orders, notifications, profile, addresses,
// wishlist) lives in the per-artifact database. Placing an order decrements
// stock in the same write batch, creates customer + staff notifications, and
// raises vendor low-stock alerts — the hybrid dark-store / multi-vendor model.

import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { asc, desc, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import * as schema from "./schema";

/* ------------------------------------------------------------------ */
/* Catalog seed data (the catalog the user approved in the front-end   */
/* build — 24 products — plus the 2026-11-19 expansion the user asked  */
/* for: chocolates, Lay's/chips & namkeen, biscuits, more drinks and   */
/* instant/grocery staples, ids 25–55, same brands/prices/stock style) */
/* ------------------------------------------------------------------ */

type SeedProduct = {
  id: number; name: string; hi: string; weight: string; price: number; mrp: number;
  category: string; icon: string; bg: string; rating: number; off: number;
  description: string; brand: string; stock: number; source: string; vendor: string;
};

const SEED_PRODUCTS: SeedProduct[] = [
  { id: 1, name: "Farm Fresh Toned Milk", hi: "Doodh", weight: "500 ml", price: 27, mrp: 30, category: "dairy", icon: "🥛", bg: "#FFF7D6", rating: 4.8, off: 10, description: "Roz subah farm se aaya toned doodh. Chai, coffee aur baccho ke liye perfect.", brand: "Amul", stock: 24, source: "dark", vendor: "" },
  { id: 2, name: "Desi Tamatar (Tomato)", hi: "Tamatar", weight: "500 g", price: 24, mrp: 40, category: "fruits", icon: "🍅", bg: "#FFE8E0", rating: 4.6, off: 40, description: "Laal, raseele desi tamatar — sabzi, salad aur chutney ke liye best.", brand: "Fatafat Fresh", stock: 18, source: "dark", vendor: "" },
  { id: 3, name: "Robusta Kela (Banana)", hi: "Kela", weight: "6 pcs", price: 36, mrp: 48, category: "fruits", icon: "🍌", bg: "#FFF3C4", rating: 4.7, off: 25, description: "Pakke hue robusta kele, energy se bharpoor. Shake aur snack dono ke liye.", brand: "Fatafat Fresh", stock: 22, source: "dark", vendor: "" },
  { id: 4, name: "Brown Bread — Whole Wheat", hi: "Bread", weight: "400 g", price: 45, mrp: 55, category: "dairy", icon: "🍞", bg: "#FDEBD0", rating: 4.5, off: 18, description: "100% whole wheat brown bread, aaj hi baked. Sandwich ke liye soft slices.", brand: "Britannia", stock: 14, source: "vendor", vendor: "Sharma General Store" },
  { id: 5, name: "Farm Eggs — Tray", hi: "Ande", weight: "12 pcs", price: 78, mrp: 96, category: "dairy", icon: "🥚", bg: "#FFF1E6", rating: 4.8, off: 19, description: "Protein-rich farm eggs, har egg check karke pack kiya gaya.", brand: "Farm Fresh", stock: 16, source: "dark", vendor: "" },
  { id: 6, name: "Aloo Chips — Masala Magic", hi: "Chips", weight: "90 g", price: 20, mrp: 20, category: "snacks", icon: "🍟", bg: "#FFEFE0", rating: 4.4, off: 0, description: "Crispy aloo chips chatpate masale ke saath. Chai-time ka best dost.", brand: "Haldiram's", stock: 30, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 7, name: "Salted Peanuts", hi: "Moongphali", weight: "200 g", price: 49, mrp: 65, category: "snacks", icon: "🥜", bg: "#F3EAD9", rating: 4.5, off: 25, description: "Bhuni hui namkeen moongphali, bilkul fresh aur crunchy.", brand: "Haldiram's", stock: 9, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 8, name: "Choco Cookies Pack", hi: "Biscuit Cookies", weight: "300 g", price: 65, mrp: 85, category: "snacks", icon: "🍪", bg: "#FDEBD0", rating: 4.6, off: 24, description: "Chocolate chips se bhari cookies — doodh ke saath kamaal.", brand: "Parle", stock: 20, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 9, name: "Cola — Chilled", hi: "Cold Drink", weight: "750 ml", price: 40, mrp: 45, category: "drinks", icon: "🥤", bg: "#E6F4FF", rating: 4.5, off: 11, description: "Bilkul chilled cola bottle. Khana ke saath perfect fizz.", brand: "Fizz Cola", stock: 26, source: "vendor", vendor: "Sharma General Store" },
  { id: 10, name: "Orange Juice — No Sugar", hi: "Juice", weight: "1 L", price: 99, mrp: 130, category: "drinks", icon: "🧃", bg: "#FFE8CC", rating: 4.7, off: 24, description: "Bina added sugar wala orange juice, Vitamin C se bharpoor.", brand: "Real", stock: 12, source: "vendor", vendor: "Sharma General Store" },
  { id: 11, name: "Cold Coffee Can", hi: "Coffee", weight: "240 ml", price: 55, mrp: 70, category: "drinks", icon: "☕", bg: "#EFE6DD", rating: 4.6, off: 21, description: "Ready-to-drink creamy cold coffee. Fridge se seedha sip.", brand: "Nescafe", stock: 4, source: "vendor", vendor: "Sharma General Store" },
  { id: 12, name: "Butter Croissant (2 pc)", hi: "Croissant", weight: "120 g", price: 89, mrp: 110, category: "bakery", icon: "🥐", bg: "#FDECEC", rating: 4.8, off: 19, description: "Makhan wala flaky croissant, bakery se fresh aaya.", brand: "Bake House", stock: 7, source: "dark", vendor: "" },
  { id: 13, name: "Chocolate Muffin", hi: "Muffin", weight: "110 g", price: 59, mrp: 75, category: "bakery", icon: "🧁", bg: "#FDECEC", rating: 4.7, off: 21, description: "Soft chocolate muffin, beech me gooey choco center.", brand: "Bake House", stock: 11, source: "dark", vendor: "" },
  { id: 14, name: "Sharbati Atta", hi: "Atta Gehu", weight: "5 kg", price: 229, mrp: 285, category: "grocery", icon: "🌾", bg: "#F3EAD9", rating: 4.8, off: 20, description: "Sharbati gehu ka atta — roti phuli-phuli aur naram banti hai.", brand: "Aashirvaad", stock: 15, source: "dark", vendor: "" },
  { id: 15, name: "Basmati Chawal", hi: "Rice Chawal", weight: "1 kg", price: 89, mrp: 115, category: "grocery", icon: "🍚", bg: "#F7F1E3", rating: 4.7, off: 23, description: "Lambi basmati, biryani aur pulao ke liye khushboodar.", brand: "India Gate", stock: 13, source: "dark", vendor: "" },
  { id: 16, name: "Haldi Powder", hi: "Haldi Turmeric", weight: "200 g", price: 42, mrp: 55, category: "grocery", icon: "🟡", bg: "#FFF3C4", rating: 4.6, off: 24, description: "Shudh haldi powder, rang aur sehat dono ke liye.", brand: "MDH", stock: 19, source: "vendor", vendor: "Sharma General Store" },
  { id: 17, name: "Fresh Paneer", hi: "Paneer", weight: "200 g", price: 85, mrp: 99, category: "dairy", icon: "🧀", bg: "#FFF7D6", rating: 4.8, off: 14, description: "Aaj ka bana naram paneer — sabzi, pakode, tikka sab chalega.", brand: "Amul", stock: 5, source: "dark", vendor: "" },
  { id: 18, name: "Hara Dhaniya + Mirchi Combo", hi: "Dhaniya Mirchi", weight: "100 g", price: 15, mrp: 25, category: "fruits", icon: "🌿", bg: "#EAF7EC", rating: 4.5, off: 40, description: "Taaza hara dhaniya aur hari mirchi ka combo pack.", brand: "Fatafat Fresh", stock: 28, source: "dark", vendor: "" },
  { id: 19, name: "Shimla Mirchi (Capsicum)", hi: "Shimla Mirchi", weight: "500 g", price: 38, mrp: 55, category: "fruits", icon: "🫑", bg: "#EAF7EC", rating: 4.6, off: 31, description: "Hari shimla mirchi, crunchy aur fresh.", brand: "Fatafat Fresh", stock: 17, source: "dark", vendor: "" },
  { id: 20, name: "Aam — Alphonso Special", hi: "Aam Mango", weight: "1 kg", price: 349, mrp: 499, category: "fruits", icon: "🥭", bg: "#FFE8CC", rating: 4.9, off: 30, description: "Season ke best Alphonso aam — meethe, raseele, khushboodar.", brand: "Fatafat Fresh", stock: 6, source: "dark", vendor: "" },
  { id: 21, name: "Gentle Face Wash", hi: "Face Wash", weight: "100 ml", price: 149, mrp: 199, category: "care", icon: "🧴", bg: "#EDE9FF", rating: 4.6, off: 25, description: "Har skin type ke liye gentle face wash, roz ke use ke liye.", brand: "Mamaearth", stock: 10, source: "vendor", vendor: "City Care Store" },
  { id: 22, name: "Herbal Shampoo", hi: "Shampoo", weight: "340 ml", price: 179, mrp: 240, category: "care", icon: "🧖", bg: "#EDE9FF", rating: 4.5, off: 25, description: "Amla-shikakai wala herbal shampoo, baalo ko naram rakhe.", brand: "Ayur Herbal", stock: 8, source: "vendor", vendor: "City Care Store" },
  { id: 23, name: "Instant Noodles (Pack of 4)", hi: "Noodles Maggi", weight: "280 g", price: 56, mrp: 64, category: "snacks", icon: "🍜", bg: "#FFEFE0", rating: 4.7, off: 13, description: "2-minute instant noodles, 4 pack. Hostel aur ghar dono ke hero.", brand: "Maggi", stock: 25, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 24, name: "Vanilla Ice Cream Tub", hi: "Ice Cream", weight: "700 ml", price: 145, mrp: 180, category: "bakery", icon: "🍦", bg: "#E6F4FF", rating: 4.8, off: 19, description: "Creamy vanilla ice cream tub — poori family ke liye.", brand: "Amul", stock: 3, source: "dark", vendor: "" },
  /* ---- Expansion (user: "or products add kro — chocolate, lays or other chizi") ---- */
  { id: 25, name: "Cadbury Dairy Milk Chocolate", hi: "Chocolate Dairy Milk", weight: "110 g", price: 82, mrp: 90, category: "chocolates", icon: "🍫", bg: "#F3E5F5", rating: 4.8, off: 9, description: "Silky smooth milk chocolate bar — India ki sabse pasandeeda chocolate.", brand: "Cadbury", stock: 40, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 26, name: "KitKat 4 Fingers", hi: "KitKat Chocolate Wafer", weight: "38.5 g", price: 28, mrp: 30, category: "chocolates", icon: "🍫", bg: "#FDECEC", rating: 4.7, off: 7, description: "Crispy wafer fingers chocolate me lipte — have a break, have a KitKat!", brand: "Nestle", stock: 45, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 27, name: "Snickers Peanut Chocolate Bar", hi: "Snickers Chocolate", weight: "45 g", price: 35, mrp: 40, category: "chocolates", icon: "🥜", bg: "#FDEBD0", rating: 4.7, off: 13, description: "Moongphali, caramel aur nougat se bhari chocolate bar — bhookh ka full ilaaj.", brand: "Mars", stock: 38, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 28, name: "Cadbury 5 Star", hi: "5 Star Chocolate", weight: "40 g", price: 20, mrp: 20, category: "chocolates", icon: "⭐", bg: "#FFF3C4", rating: 4.5, off: 0, description: "Soft caramel-nougat wali classic 5 Star — khao aur kho jao.", brand: "Cadbury", stock: 50, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 29, name: "Cadbury Perk", hi: "Perk Chocolate Wafer", weight: "13 g", price: 5, mrp: 5, category: "chocolates", icon: "⚡", bg: "#E6F4FF", rating: 4.4, off: 0, description: "Halki-phulki crispy wafer chocolate — kabhi bhi, kahin bhi wali treat.", brand: "Cadbury", stock: 60, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 30, name: "Nestle Munch Max", hi: "Munch Chocolate Wafer", weight: "38.5 g", price: 20, mrp: 20, category: "chocolates", icon: "🍫", bg: "#F3E5F5", rating: 4.5, off: 0, description: "Extra crunchy, extra choco wafer bar — Munch ka full mazaa.", brand: "Nestle", stock: 45, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 31, name: "Cadbury Dairy Milk Silk", hi: "Silk Chocolate Premium", weight: "150 g", price: 165, mrp: 185, category: "chocolates", icon: "🍫", bg: "#F3E5F5", rating: 4.9, off: 11, description: "Premium silky-smooth chocolate — gift ke liye aur khud ko treat dene ke liye best.", brand: "Cadbury", stock: 18, source: "dark", vendor: "" },
  { id: 32, name: "Ferrero Rocher (4 pc)", hi: "Ferrero Rocher Chocolate", weight: "50 g", price: 149, mrp: 175, category: "chocolates", icon: "🌰", bg: "#FDEBD0", rating: 4.9, off: 15, description: "Golden hazelnut chocolate balls — premium gifting wala pack.", brand: "Ferrero", stock: 14, source: "dark", vendor: "" },
  { id: 33, name: "Lay's Magic Masala Chips", hi: "Lays Chips Masala", weight: "73 g", price: 20, mrp: 20, category: "snacks", icon: "🥔", bg: "#E3F2FD", rating: 4.6, off: 0, description: "India ka favourite — chatpata Magic Masala flavour, perfect crunch ke saath.", brand: "Lay's", stock: 50, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 34, name: "Lay's Classic Salted Chips", hi: "Lays Chips Salted Namkeen", weight: "73 g", price: 20, mrp: 20, category: "snacks", icon: "🥔", bg: "#FFF3C4", rating: 4.5, off: 0, description: "Halke namak wale classic crispy chips — simple aur sabse best.", brand: "Lay's", stock: 45, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 35, name: "Kurkure Masala Munch", hi: "Kurkure Namkeen", weight: "90 g", price: 20, mrp: 20, category: "snacks", icon: "🌽", bg: "#FFE8E0", rating: 4.5, off: 0, description: "Tedha hai par mera hai — masaledar crunchy Kurkure sticks.", brand: "Kurkure", stock: 48, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 36, name: "Bingo! Mad Angles — Mmmmm Masala", hi: "Bingo Chips Namkeen", weight: "90 g", price: 20, mrp: 20, category: "snacks", icon: "🔺", bg: "#FFEFE0", rating: 4.4, off: 0, description: "Triangle wale masala corn chips — har angle se chatpate.", brand: "Bingo", stock: 40, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 37, name: "Haldiram's Aloo Bhujia", hi: "Aloo Bhujia Namkeen", weight: "400 g", price: 105, mrp: 120, category: "snacks", icon: "🥨", bg: "#EAF7EC", rating: 4.7, off: 13, description: "Masaledar aloo bhujia — chai ke saath aur bina chai ke bhi superhit namkeen.", brand: "Haldiram's", stock: 25, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 38, name: "Act II Popcorn — Classic Salted", hi: "Popcorn", weight: "90 g", price: 35, mrp: 40, category: "snacks", icon: "🍿", bg: "#FFF3C4", rating: 4.5, off: 13, description: "3 minute me garam-garam popcorn — movie night ke liye ready.", brand: "Act II", stock: 30, source: "vendor", vendor: "Sharma General Store" },
  { id: 39, name: "Parle-G Gold Biscuits", hi: "Parle G Biscuit", weight: "1 kg", price: 140, mrp: 150, category: "snacks", icon: "🍪", bg: "#FDEBD0", rating: 4.8, off: 7, description: "Bharat ka apna biscuit — chai me dubo ke khane wala bada family pack.", brand: "Parle", stock: 30, source: "vendor", vendor: "Sharma General Store" },
  { id: 40, name: "Britannia Good Day Butter Cookies", hi: "Good Day Biscuit Cookies", weight: "100 g", price: 25, mrp: 30, category: "snacks", icon: "🍪", bg: "#E6F4FF", rating: 4.6, off: 17, description: "Makhan wali smile cookies — har bite me good day wala taste.", brand: "Britannia", stock: 35, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 41, name: "Cadbury Oreo Original", hi: "Oreo Biscuit Cookies", weight: "41.75 g", price: 25, mrp: 25, category: "snacks", icon: "🍪", bg: "#E3F2FD", rating: 4.6, off: 0, description: "Twist, lick, dunk — cream wale chocolate sandwich biscuits.", brand: "Cadbury", stock: 40, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 42, name: "Parle Monaco Classic", hi: "Monaco Biscuit Namkeen", weight: "261 g", price: 55, mrp: 65, category: "snacks", icon: "🍘", bg: "#FFF3C4", rating: 4.5, off: 15, description: "Halke namkeen crispy crackers — chai-time aur topping dono ke liye.", brand: "Parle", stock: 28, source: "vendor", vendor: "Sharma General Store" },
  { id: 43, name: "Britannia Toastea Rusk", hi: "Rusk Toast Chai", weight: "400 g", price: 65, mrp: 75, category: "bakery", icon: "🍞", bg: "#FDEBD0", rating: 4.6, off: 13, description: "Kadak bake rusk — subah ki chai ka permanent saathi.", brand: "Britannia", stock: 20, source: "vendor", vendor: "Sharma General Store" },
  { id: 44, name: "Coca-Cola — Original Taste", hi: "Coke Cold Drink", weight: "750 ml", price: 40, mrp: 45, category: "drinks", icon: "🥤", bg: "#FDECEC", rating: 4.7, off: 11, description: "Bilkul chilled original Coca-Cola — khana ho ya party, sab ke saath perfect.", brand: "Coca-Cola", stock: 30, source: "vendor", vendor: "Sharma General Store" },
  { id: 45, name: "Pepsi — Original", hi: "Pepsi Cold Drink", weight: "750 ml", price: 40, mrp: 45, category: "drinks", icon: "🥤", bg: "#E6F4FF", rating: 4.6, off: 11, description: "Thandi Pepsi bottle — full fizz, full refreshment.", brand: "Pepsi", stock: 28, source: "vendor", vendor: "Sharma General Store" },
  { id: 46, name: "Sprite — Lemon-Lime", hi: "Sprite Cold Drink", weight: "750 ml", price: 40, mrp: 45, category: "drinks", icon: "🍋", bg: "#EAF7EC", rating: 4.6, off: 11, description: "Nimbu wala fresh sparkle — garmi me sabse best thandak.", brand: "Sprite", stock: 26, source: "vendor", vendor: "Sharma General Store" },
  { id: 47, name: "Frooti — Mango Drink", hi: "Frooti Aam Mango Drink", weight: "1 L", price: 60, mrp: 66, category: "drinks", icon: "🧃", bg: "#FFF3C4", rating: 4.7, off: 9, description: "Aam ka asli mazaa — bachpan wali Frooti, bade pack me.", brand: "Parle Agro", stock: 22, source: "vendor", vendor: "Sharma General Store" },
  { id: 48, name: "Maaza — Mango Drink", hi: "Maaza Aam Mango Drink", weight: "1.2 L", price: 72, mrp: 80, category: "drinks", icon: "🥭", bg: "#FFE8CC", rating: 4.7, off: 10, description: "Raseela aam drink — poori family ke liye bada bottle pack.", brand: "Maaza", stock: 20, source: "vendor", vendor: "Sharma General Store" },
  { id: 49, name: "Red Bull Energy Drink", hi: "Red Bull Energy Drink", weight: "250 ml", price: 125, mrp: 125, category: "drinks", icon: "⚡", bg: "#E6F4FF", rating: 4.6, off: 0, description: "Energy wala can — kaam, gym ya late-night padhai ke liye boost.", brand: "Red Bull", stock: 16, source: "dark", vendor: "" },
  { id: 50, name: "Maggi Noodles — Single Pack", hi: "Maggi Noodles", weight: "70 g", price: 14, mrp: 14, category: "snacks", icon: "🍜", bg: "#FFEFE0", rating: 4.7, off: 0, description: "Ek wala chhota pack — 2 minute me masala noodles ready.", brand: "Maggi", stock: 60, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 51, name: "Knorr Hot & Sour Veg Soup", hi: "Soup Knorr", weight: "51 g", price: 55, mrp: 62, category: "grocery", icon: "🍲", bg: "#EAF7EC", rating: 4.5, off: 11, description: "Garam-garam Chinese style soup — 100% real sabziyon ke saath, ghar par restaurant wala swad.", brand: "Knorr", stock: 18, source: "vendor", vendor: "Sharma General Store" },
  { id: 52, name: "Tata Tea Gold", hi: "Chai Tea Tata Gold", weight: "500 g", price: 240, mrp: 270, category: "grocery", icon: "🍵", bg: "#FFF3C4", rating: 4.8, off: 11, description: "Kadak chai patti — rich taste aur khushboo, subah ki shuruaat ke liye.", brand: "Tata Tea", stock: 15, source: "dark", vendor: "" },
  { id: 53, name: "Nescafe Classic Coffee", hi: "Coffee Nescafe", weight: "200 g", price: 355, mrp: 390, category: "grocery", icon: "☕", bg: "#EFE6DD", rating: 4.7, off: 9, description: "Instant coffee jar — garam ya thandi, jaise chaaho waise banao.", brand: "Nescafe", stock: 12, source: "vendor", vendor: "Sharma General Store" },
  { id: 54, name: "Cadbury Bournvita", hi: "Bournvita Health Drink", weight: "500 g", price: 235, mrp: 260, category: "grocery", icon: "🥛", bg: "#FFE8CC", rating: 4.7, off: 10, description: "Baccho ke liye chocolate health drink — doodh ke saath tann ki shakti, mann ki shakti.", brand: "Cadbury", stock: 14, source: "vendor", vendor: "Sharma General Store" },
  { id: 55, name: "Dabur Honey — 100% Pure", hi: "Shahad Honey Dabur", weight: "250 g", price: 105, mrp: 125, category: "grocery", icon: "🍯", bg: "#FFF7D6", rating: 4.6, off: 16, description: "Shudh shahad — garam paani, chai ya toast ke saath roz ki sehat.", brand: "Dabur", stock: 16, source: "dark", vendor: "" },
  /* ---- Expansion 2 (user: "sb kuch kr doo") — Personal Care poora, Baby Care + Pet Food, Frozen ---- */
  { id: 56, name: "Dettol Original Soap (Pack of 4)", hi: "Sabun Soap Dettol", weight: "4 × 100 g", price: 118, mrp: 136, category: "care", icon: "🧼", bg: "#EAF7EC", rating: 4.6, off: 13, description: "99.99% germs se protection wala original Dettol sabun — poori family ke liye 4 ka pack.", brand: "Dettol", stock: 22, source: "vendor", vendor: "City Care Store" },
  { id: 57, name: "Colgate MaxFresh Toothpaste", hi: "Toothpaste Colgate Manjan", weight: "150 g", price: 95, mrp: 110, category: "care", icon: "🪥", bg: "#FDECEC", rating: 4.7, off: 14, description: "Gehri saafai aur taaza saans — cavity protection ke saath roz wala toothpaste.", brand: "Colgate", stock: 26, source: "vendor", vendor: "City Care Store" },
  { id: 58, name: "Fogg Force Deodorant Spray", hi: "Deo Perfume Fogg Body Spray", weight: "150 ml", price: 199, mrp: 275, category: "care", icon: "🧴", bg: "#E6F4FF", rating: 4.5, off: 28, description: "Long-lasting fragrance body spray — bina gas wala, poora din fresh rakhe.", brand: "Fogg", stock: 18, source: "vendor", vendor: "City Care Store" },
  { id: 59, name: "Parachute Coconut Hair Oil", hi: "Nariyal Tel Hair Oil Parachute", weight: "300 ml", price: 115, mrp: 132, category: "care", icon: "🥥", bg: "#EAF7EC", rating: 4.7, off: 13, description: "100% shudh nariyal tel — lambe, ghane aur mazboot baalo ke liye.", brand: "Parachute", stock: 20, source: "vendor", vendor: "City Care Store" },
  { id: 60, name: "Lifebuoy Hand Sanitizer", hi: "Sanitizer Hand Wash Lifebuoy", weight: "190 ml", price: 75, mrp: 99, category: "care", icon: "🧴", bg: "#E6F4FF", rating: 4.5, off: 24, description: "99.99% germs marne wala hand sanitizer — ghar, office aur safar ke liye.", brand: "Lifebuoy", stock: 24, source: "vendor", vendor: "City Care Store" },
  { id: 61, name: "Surf Excel Easy Wash Detergent", hi: "Detergent Surf Kapde Dhone", weight: "1 kg", price: 118, mrp: 135, category: "care", icon: "🧺", bg: "#E3F2FD", rating: 4.6, off: 13, description: "Ziddi daag aasani se nikale — haath aur machine dono wash ke liye.", brand: "Surf Excel", stock: 16, source: "vendor", vendor: "Sharma General Store" },
  { id: 62, name: "Nivea Body Lotion", hi: "Body Lotion Cream Nivea", weight: "200 ml", price: 185, mrp: 225, category: "care", icon: "🧴", bg: "#EDE9FF", rating: 4.6, off: 18, description: "48 ghante tak gehra moisture — dry skin ke liye roz wala body lotion.", brand: "Nivea", stock: 14, source: "vendor", vendor: "City Care Store" },
  { id: 63, name: "Gillette Shaving Foam", hi: "Shaving Cream Foam Gillette", weight: "196 g", price: 160, mrp: 185, category: "care", icon: "🪒", bg: "#EFE6DD", rating: 4.5, off: 14, description: "Ghani, naram foam — smooth shave bina jalan ke.", brand: "Gillette", stock: 12, source: "vendor", vendor: "City Care Store" },
  { id: 64, name: "Pampers Baby Diapers (M, 24 pc)", hi: "Diaper Baby Pampers", weight: "24 pcs", price: 399, mrp: 499, category: "babypet", icon: "👶", bg: "#FFF7D6", rating: 4.8, off: 20, description: "12 ghante tak dry rakhe — soft, rash-free diapers baby ki neend ke liye.", brand: "Pampers", stock: 15, source: "vendor", vendor: "City Care Store" },
  { id: 65, name: "Nestle Cerelac Wheat Baby Food", hi: "Cerelac Baby Khana", weight: "300 g", price: 255, mrp: 285, category: "babypet", icon: "🍼", bg: "#FFE8CC", rating: 4.8, off: 11, description: "6 mahine+ ke baby ke liye iron aur vitamins wala wheat cereal.", brand: "Nestle", stock: 13, source: "vendor", vendor: "City Care Store" },
  { id: 66, name: "Johnson's Baby Soap", hi: "Baby Sabun Soap Johnsons", weight: "75 g", price: 52, mrp: 60, category: "babypet", icon: "🧼", bg: "#FDECEC", rating: 4.7, off: 13, description: "Baby ki naram skin ke liye extra mild soap — no tears, sirf softness.", brand: "Johnson's", stock: 21, source: "vendor", vendor: "City Care Store" },
  { id: 67, name: "Pedigree Dog Food — Chicken & Veg", hi: "Dog Food Kutta Khana Pedigree", weight: "1.2 kg", price: 349, mrp: 399, category: "babypet", icon: "🐶", bg: "#FDEBD0", rating: 4.7, off: 13, description: "Adult dogs ke liye complete nutrition — chicken aur sabziyon ke saath.", brand: "Pedigree", stock: 11, source: "vendor", vendor: "City Care Store" },
  { id: 68, name: "Whiskas Cat Food — Ocean Fish", hi: "Cat Food Billi Khana Whiskas", weight: "480 g", price: 185, mrp: 210, category: "babypet", icon: "🐱", bg: "#F3E5F5", rating: 4.6, off: 12, description: "Billi ke liye ocean fish flavour — chamakti skin aur sehatmand coat ke liye.", brand: "Whiskas", stock: 14, source: "vendor", vendor: "City Care Store" },
  { id: 69, name: "Drools Dog Treats — Calcium Bones", hi: "Dog Treats Biscuit Drools", weight: "300 g", price: 165, mrp: 199, category: "babypet", icon: "🦴", bg: "#F3EAD9", rating: 4.6, off: 17, description: "Calcium wali treat bones — daant mazboot, kutta khush.", brand: "Drools", stock: 17, source: "vendor", vendor: "City Care Store" },
  { id: 70, name: "Safal Frozen Green Peas", hi: "Frozen Matar Peas Safal", weight: "500 g", price: 65, mrp: 80, category: "frozen", icon: "🟢", bg: "#EAF7EC", rating: 4.6, off: 19, description: "Taaze hare matar, frozen fresh — bina chilke ki mehnat, seedha sabzi me.", brand: "Safal", stock: 25, source: "dark", vendor: "" },
  { id: 71, name: "Frozen Mix Veg Momos (25 pc)", hi: "Momos Frozen Veg", weight: "500 g", price: 149, mrp: 180, category: "frozen", icon: "🥟", bg: "#EAF7EC", rating: 4.5, off: 17, description: "Steam karo 6-8 minute — ghar par restaurant wale mix veg momos ready.", brand: "Fatafat Fresh", stock: 18, source: "dark", vendor: "" },
  { id: 72, name: "Frozen Sweet Corn", hi: "Frozen Corn Makka Sweet", weight: "500 g", price: 75, mrp: 95, category: "frozen", icon: "🌽", bg: "#FFF3C4", rating: 4.5, off: 21, description: "Meethe corn ke daane — chaat, soup, sabzi aur pulao ke liye ready.", brand: "Safal", stock: 22, source: "dark", vendor: "" },
  { id: 73, name: "Frozen Mixed Vegetables", hi: "Frozen Mix Sabzi Vegetables", weight: "500 g", price: 69, mrp: 85, category: "frozen", icon: "🥕", bg: "#FFE8E0", rating: 4.4, off: 19, description: "Gajar, beans, matar aur corn ka ready mix — pulao aur sabzi ke liye perfect.", brand: "Safal", stock: 20, source: "dark", vendor: "" },
  { id: 74, name: "Amul Sundae Chocolate Ice Cream", hi: "Ice Cream Chocolate Amul", weight: "700 ml", price: 160, mrp: 199, category: "frozen", icon: "🍨", bg: "#FDEBD0", rating: 4.8, off: 20, description: "Rich chocolate sundae tub — upar se choco sauce ke saath family pack.", brand: "Amul", stock: 12, source: "dark", vendor: "" },
  { id: 75, name: "Butterscotch Ice Cream Tub", hi: "Ice Cream Butterscotch", weight: "700 ml", price: 155, mrp: 185, category: "frozen", icon: "🍦", bg: "#FFF3C4", rating: 4.7, off: 16, description: "Crunchy praline wala creamy butterscotch — har party ki shaan.", brand: "Kwality Wall's", stock: 10, source: "dark", vendor: "" },
];

const SEED_AREAS = [
  { id: "sec62", name: "Sector 62, Noida", distKm: 0.8, serviceable: 1, storeName: "Fatafat Dark Store — Sector 62", storeType: "Apna Dark Store (Hybrid Model)", eta: "8 min", unavailableIds: "[]" },
  { id: "sec18", name: "Sector 18, Noida", distKm: 1.5, serviceable: 1, storeName: "Partner: Sharma General Store — Sector 18", storeType: "Multi-Vendor Partner Store", eta: "10 min", unavailableIds: "[20,12,32]" },
  { id: "indirapuram", name: "Indirapuram, Ghaziabad", distKm: 1.9, serviceable: 1, storeName: "Fatafat Dark Store — Indirapuram", storeType: "Apna Dark Store (Hybrid Model)", eta: "11 min", unavailableIds: "[24,17,49]" },
  { id: "grnoida", name: "Greater Noida West", distKm: 4.5, serviceable: 0, storeName: "Koi store paas nahi", storeType: "2 km radius ke bahar", eta: "—", unavailableIds: "[]" },
  { id: "mayur", name: "Mayur Vihar, Delhi", distKm: 3.2, serviceable: 0, storeName: "Koi store paas nahi", storeType: "2 km radius ke bahar", eta: "—", unavailableIds: "[]" },
];

const COUPONS: Record<string, { off: number; min: number; label: string }> = {
  FATA75: { off: 75, min: 299, label: "FATA75 · ₹75 OFF" },
  FIRST50: { off: 50, min: 199, label: "FIRST50 · ₹50 OFF" },
};

const STATUS_STEPS = ["placed", "packing", "on_the_way", "delivered"] as const;
const STATUS_LABELS: Record<string, string> = {
  placed: "Order Mil Gaya",
  packing: "Packing Ho Rahi Hai",
  on_the_way: "Rider Raste Me Hai",
  delivered: "Delivered ✓",
  cancelled: "Cancelled",
};
/** Seconds after creation at which each step auto-advances (demo pacing). */
const STEP_SECONDS = [0, 40, 100, 190];

async function ensureSeeded(ctx: Ctx): Promise<void> {
  const db = ctx.db<typeof schema>();
  const existing = await db.select({ id: schema.products.id }).from(schema.products);
  if (existing.length > 0) {
    // Backfill for databases seeded with an earlier catalog: insert any
    // seed products that are missing (never overwrites existing rows, so
    // live stock and staff edits stay untouched) and refresh the static
    // per-area availability lists.
    const have = new Set(existing.map((r) => r.id));
    const stmts: BatchItem<"sqlite">[] = [];
    for (const [i, p] of SEED_PRODUCTS.entries()) {
      if (have.has(p.id)) continue;
      stmts.push(
        db.insert(schema.products).values({
          id: p.id, name: p.name, hi: p.hi, weight: p.weight, price: p.price, mrp: p.mrp,
          category: p.category, brand: p.brand, stock: p.stock, source: p.source, vendor: p.vendor,
          rating: p.rating, offPct: p.off, description: p.description, bg: p.bg, icon: p.icon, sortOrder: i,
        }),
      );
    }
    for (const a of SEED_AREAS) {
      stmts.push(db.update(schema.areas).set({ unavailableIds: a.unavailableIds }).where(eq(schema.areas.id, a.id)));
    }
    const [first, ...rest] = stmts;
    if (first) await db.batch([first, ...rest]);
    await ensurePartnerVendors(ctx);
    return;
  }
  const stmts: BatchItem<"sqlite">[] = [];
  for (const [i, p] of SEED_PRODUCTS.entries()) {
    stmts.push(
      db.insert(schema.products).values({
        id: p.id, name: p.name, hi: p.hi, weight: p.weight, price: p.price, mrp: p.mrp,
        category: p.category, brand: p.brand, stock: p.stock, source: p.source, vendor: p.vendor,
        rating: p.rating, offPct: p.off, description: p.description, bg: p.bg, icon: p.icon, sortOrder: i,
      }),
    );
  }
  for (const a of SEED_AREAS) stmts.push(db.insert(schema.areas).values(a));
  stmts.push(db.insert(schema.profile).values({ id: 1, name: "Aryan", phone: "98765 43210", currentAreaId: "sec62", referralCode: referralCodeFor("Aryan", "98765 43210"), referredBy: "", coins: 0 }));
  stmts.push(db.insert(schema.addresses).values({ label: "Home", text: "Sector 62, Noida, Uttar Pradesh 201301", isActive: 1 }));
  stmts.push(db.insert(schema.addresses).values({ label: "Office", text: "C-Block, Sector 62, Noida 201309", isActive: 0 }));
  stmts.push(
    db.insert(schema.notifications).values({
      audience: "customer", type: "offer",
      title: "🎉 FATA75 Ready Hai",
      message: "₹299+ par ₹75 OFF — cart me coupon lagao.",
      isRead: 0, createdAt: new Date(),
    }),
  );
  const [first, ...rest] = stmts;
  if (first) await db.batch([first, ...rest]);
  await ensurePartnerVendors(ctx);
}

/** The catalog's three built-in partner stores (their names live on
 *  product rows as the vendor string) get matching rows in the vendors
 *  table so the Admin Panel's vendor list and dashboard count agree
 *  with what the storefront shows. Runs only while the vendors table
 *  is empty and only for names actually referenced by products — so if
 *  the admin removes a partner (which also removes their products),
 *  the row is not resurrected. */
const PARTNER_VENDOR_NAMES = ["Sharma General Store", "Gupta Snacks Corner", "City Care Store"];
async function ensurePartnerVendors(ctx: Ctx): Promise<void> {
  const db = ctx.db<typeof schema>();
  const existing = await db.select({ id: schema.vendors.id }).from(schema.vendors).limit(1);
  if (existing.length > 0) return;
  const prods = await db.select({ vendor: schema.products.vendor }).from(schema.products);
  const used = new Set(prods.map((p) => p.vendor).filter((v) => v !== ""));
  const now = new Date();
  for (const name of PARTNER_VENDOR_NAMES) {
    if (!used.has(name)) continue;
    await db.insert(schema.vendors).values({ shopName: name, ownerName: "", phone: "", area: "", status: "approved", createdAt: now });
  }
}

function referralCodeFor(name: string, phone: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "DOST";
  const last4 = phone.replace(/\D/g, "").slice(-4) || "0000";
  return `FF-${clean}-${last4}`;
}

/** Backfills the referral code for profile rows created before loyalty existed. */
async function ensureLoyalty(ctx: Ctx): Promise<void> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.profile).limit(1);
  const p = rows[0];
  if (p && !p.referralCode) {
    await db.update(schema.profile)
      .set({ referralCode: referralCodeFor(p.name, p.phone) })
      .where(eq(schema.profile.id, p.id));
  }
}

/* ------------------------------------------------------------------ */
/* Admin security: hashed PIN, server-side sessions, brute-force       */
/* lockout, activity log, live store settings. The PIN is verified     */
/* ONLY on the server; the client just holds an opaque session token.  */
/* ------------------------------------------------------------------ */

const DEFAULT_ADMIN_PIN = "1114";
const ADMIN_SESSION_MS = 30 * 60 * 1000; // auto-expire after 30 min idle
const ADMIN_LOCK_MS = 5 * 60 * 1000; // lock duration after too many failures
const ADMIN_MAX_ATTEMPTS = 5;

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${pin}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function logActivity(ctx: Ctx, kind: string, detail: string): Promise<void> {
  const db = ctx.db<typeof schema>();
  await db.insert(schema.adminActivity).values({ kind, detail, createdAt: new Date() });
}

/** Seeds the admin credential row (default PIN, stored only as a salted
 *  hash), the store settings row, and the platform coupon rows. */
async function ensureAdminSeeded(ctx: Ctx): Promise<void> {
  const db = ctx.db<typeof schema>();
  const cfg = await db.select().from(schema.adminConfig).limit(1);
  if (!cfg[0]) {
    const salt = randomHex(16);
    const pinHash = await hashPin(DEFAULT_ADMIN_PIN, salt);
    await db.insert(schema.adminConfig).values({ id: 1, pinHash, salt, failedAttempts: 0, lockedUntil: 0 });
  }
  const st = await db.select().from(schema.appSettings).limit(1);
  if (!st[0]) {
    await db.insert(schema.appSettings).values({ id: 1, deliveryCharge: 25, freeThreshold: 199, geofenceKm: 2 });
  }
  const pc = await db.select().from(schema.platformCoupons);
  if (pc.length === 0) {
    for (const [code, c] of Object.entries(COUPONS)) {
      await db.insert(schema.platformCoupons).values({ code, off: c.off, minOrder: c.min, label: c.label, enabled: 1 });
    }
  }
}

async function getSettings(ctx: Ctx): Promise<{ deliveryCharge: number; freeThreshold: number; geofenceKm: number }> {
  await ensureAdminSeeded(ctx);
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.appSettings).limit(1);
  const s = rows[0];
  return {
    deliveryCharge: s?.deliveryCharge ?? 25,
    freeThreshold: s?.freeThreshold ?? 199,
    geofenceKm: s?.geofenceKm ?? 2,
  };
}

/** Validates an admin session token server-side. A valid call slides the
 *  expiry forward (activity = alive); 30 minutes without any admin call
 *  expires the session and the row is deleted. */
async function requireAdmin(ctx: Ctx, token: string): Promise<boolean> {
  if (!token) return false;
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.adminSessions).where(eq(schema.adminSessions.token, token)).limit(1);
  const s = rows[0];
  if (!s) return false;
  const now = Date.now();
  if (s.expiresAt.getTime() <= now) {
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, token));
    return false;
  }
  await db.update(schema.adminSessions)
    .set({ expiresAt: new Date(now + ADMIN_SESSION_MS) })
    .where(eq(schema.adminSessions.token, token));
  return true;
}

const SESSION_EXPIRED = "Admin session expire ya invalid hai — suraksha ke liye phir se PIN daal kar login karo.";

/** Single coupon lookup used by BOTH validateCoupon and placeOrder, so
 *  admin enable/disable/delete takes effect everywhere at once. All
 *  amounts come from the database — never from the client. */
async function findCoupon(ctx: Ctx, code: string): Promise<
  | { found: true; off: number; min: number; label: string }
  | { found: false; reason: "unknown" | "disabled" }
> {
  await ensureAdminSeeded(ctx);
  const db = ctx.db<typeof schema>();
  const pc = await db.select().from(schema.platformCoupons).where(eq(schema.platformCoupons.code, code)).limit(1);
  const p = pc[0];
  if (p) {
    if (p.enabled !== 1) return { found: false, reason: "disabled" };
    return { found: true, off: p.off, min: p.minOrder, label: p.label };
  }
  const vc = await db.select().from(schema.vendorCoupons).where(eq(schema.vendorCoupons.code, code)).limit(1);
  const v = vc[0];
  if (v) {
    if (v.enabled !== 1) return { found: false, reason: "disabled" };
    return { found: true, off: v.off, min: v.minOrder, label: `${v.code} · ₹${v.off} OFF (${v.vendorName})` };
  }
  return { found: false, reason: "unknown" };
}

/* ------------------------------------------------------------------ */
/* Customer accounts: the legacy demo profile becomes guest account    */
/* id 1; sign-up/login move the app_state pointer so every customer    */
/* action (orders, coins, subscriptions, addresses, wishlist) is       */
/* scoped to whoever is logged in.                                     */
/* ------------------------------------------------------------------ */

type AccountRow = typeof schema.accounts.$inferSelect;
const CUSTOMER_SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Normalizes an Indian mobile to its 10-digit local form (+91 / 0
 *  prefixes accepted), or null when it is not a valid mobile number. */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2)
    : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

async function ensureAccounts(ctx: Ctx): Promise<void> {
  const db = ctx.db<typeof schema>();
  const accs = await db.select({ id: schema.accounts.id }).from(schema.accounts);
  if (accs.length === 0) {
    const prof = await db.select().from(schema.profile).limit(1);
    const p = prof[0];
    await db.insert(schema.accounts).values({
      id: 1,
      name: p?.name ?? "Aryan",
      phone: p?.phone ?? "98765 43210",
      pinHash: "", salt: "",
      referralCode: p?.referralCode || referralCodeFor(p?.name ?? "Aryan", p?.phone ?? "98765 43210"),
      referredBy: p?.referredBy ?? "",
      coins: p?.coins ?? 0,
      currentAreaId: p?.currentAreaId ?? "sec62",
      createdAt: new Date(),
    });
  }
  const st = await db.select().from(schema.appState).limit(1);
  if (!st[0]) {
    await db.insert(schema.appState).values({ id: 1, currentAccountId: 1, currentSessionToken: "" });
  }
}

/** The account the app is currently acting as, plus whether this is a
 *  real login session or the default guest account. */
async function currentContext(ctx: Ctx): Promise<{ account: AccountRow; isGuest: boolean; sessionToken: string }> {
  await ensureAccounts(ctx);
  const db = ctx.db<typeof schema>();
  const st = await db.select().from(schema.appState).limit(1);
  const state = st[0];
  const wanted = state?.currentAccountId ?? 1;
  const rows = await db.select().from(schema.accounts).where(eq(schema.accounts.id, wanted)).limit(1);
  let account = rows[0];
  if (!account) {
    const guest = await db.select().from(schema.accounts).where(eq(schema.accounts.id, 1)).limit(1);
    account = guest[0];
  }
  if (!account) {
    // Unreachable in practice (ensureAccounts seeds account 1); a typed
    // fallback keeps the compiler honest without inventing user data.
    account = {
      id: 1, name: "Guest", phone: "", pinHash: "", salt: "", failedAttempts: 0, lockedUntil: 0,
      referralCode: "", referredBy: "", coins: 0, currentAreaId: "sec62", createdAt: new Date(),
    };
  }
  const sessionToken = state?.currentSessionToken ?? "";
  return { account, isGuest: sessionToken === "", sessionToken };
}

async function findAccountByPhone(ctx: Ctx, local10: string): Promise<AccountRow | undefined> {
  const db = ctx.db<typeof schema>();
  const all = await db.select().from(schema.accounts);
  return all.find((a) => normalizePhone(a.phone) === local10);
}

/** Creates a customer session and points the app at that account. */
async function startCustomerSession(ctx: Ctx, accountId: number): Promise<string> {
  const db = ctx.db<typeof schema>();
  const token = randomHex(24);
  const now = Date.now();
  await db.batch([
    db.insert(schema.customerSessions).values({
      token, accountId, createdAt: new Date(now), expiresAt: new Date(now + CUSTOMER_SESSION_MS),
    }),
    db.update(schema.appState)
      .set({ currentAccountId: accountId, currentSessionToken: token })
      .where(eq(schema.appState.id, 1)),
  ]);
  return token;
}

function effectiveStep(order: { status: string; statusStep: number; createdAt: Date }): number {
  if (order.status === "cancelled") return order.statusStep;
  const elapsed = (Date.now() - order.createdAt.getTime()) / 1000;
  let step = order.statusStep;
  for (let i = 0; i < STEP_SECONDS.length; i++) {
    const t = STEP_SECONDS[i] ?? 0;
    if (elapsed >= t) step = Math.max(step, i);
  }
  return Math.min(step, 3);
}

const productShape = z.object({
  id: z.number(), name: z.string(), hi: z.string(), weight: z.string(),
  price: z.number(), mrp: z.number(), category: z.string(), brand: z.string(),
  stock: z.number(), source: z.string(), vendor: z.string(), rating: z.number(),
  review_count: z.number(),
  off: z.number(), description: z.string(), bg: z.string(), icon: z.string(),
});

type ProductRow = typeof schema.products.$inferSelect;
type ReviewRow = typeof schema.reviews.$inferSelect;

/** Average rating + count per product from review rows. When a product has
 *  reviews, the card rating becomes the real review average. */
function reviewAgg(rows: ReviewRow[]): Map<number, { avg: number; count: number }> {
  const sums = new Map<number, { sum: number; count: number }>();
  for (const r of rows) {
    const e = sums.get(r.productId) ?? { sum: 0, count: 0 };
    e.sum += r.rating; e.count += 1;
    sums.set(r.productId, e);
  }
  const out = new Map<number, { avg: number; count: number }>();
  for (const [k, v] of sums) out.set(k, { avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count });
  return out;
}

function toProduct(p: ProductRow, agg: Map<number, { avg: number; count: number }>): z.infer<typeof productShape> {
  const a = agg.get(p.id);
  return {
    id: p.id, name: p.name, hi: p.hi, weight: p.weight, price: p.price, mrp: p.mrp,
    category: p.category, brand: p.brand, stock: p.stock, source: p.source, vendor: p.vendor,
    rating: a ? a.avg : p.rating, review_count: a?.count ?? 0,
    off: p.offPct, description: p.description, bg: p.bg, icon: p.icon,
  };
}

const orderShape = z.object({
  id: z.string(), customer_name: z.string(), phone: z.string(),
  address_label: z.string(), address_text: z.string(), area_name: z.string(),
  items: z.array(z.object({
    product_id: z.number(), name: z.string(), weight: z.string(),
    price: z.number(), qty: z.number(),
  })),
  items_count: z.number(), subtotal: z.number(), discount: z.number(),
  delivery_fee: z.number(), grand_total: z.number(), coupon_code: z.string(),
  coins_redeemed: z.number(), coins_earned: z.number(),
  payment_method: z.string(), payment_detail: z.string(), instructions: z.string(),
  delivery_slot: z.string(), is_gift: z.boolean(), gift_name: z.string(),
  gift_phone: z.string(), gift_note: z.string(),
  status: z.string(), status_label: z.string(), status_step: z.number(),
  eta_minutes: z.number(), rating: z.number().nullable(),
  created_at: z.string(),
});

type OrderRow = typeof schema.orders.$inferSelect;

function toOrder(o: OrderRow): z.infer<typeof orderShape> {
  const step = effectiveStep(o);
  const status = o.status === "cancelled" ? "cancelled" : (STATUS_STEPS[step] ?? "placed");
  const elapsedMin = (Date.now() - o.createdAt.getTime()) / 60000;
  const eta = status === "delivered" || status === "cancelled" ? 0 : Math.max(1, Math.ceil(8 - elapsedMin));
  let items: z.infer<typeof orderShape>["items"] = [];
  try {
    const parsed: unknown = JSON.parse(o.items);
    if (Array.isArray(parsed)) items = parsed as typeof items;
  } catch { items = []; }
  return {
    id: o.id, customer_name: o.customerName, phone: o.phone,
    address_label: o.addressLabel, address_text: o.addressText, area_name: o.areaName,
    items, items_count: o.itemsCount, subtotal: o.subtotal, discount: o.discount,
    delivery_fee: o.deliveryFee, grand_total: o.grandTotal, coupon_code: o.couponCode,
    coins_redeemed: o.coinsRedeemed, coins_earned: o.coinsEarned,
    payment_method: o.paymentMethod, payment_detail: o.paymentDetail, instructions: o.instructions,
    delivery_slot: o.deliverySlot, is_gift: o.isGift === 1, gift_name: o.giftName,
    gift_phone: o.giftPhone, gift_note: o.giftNote,
    status, status_label: STATUS_LABELS[status] ?? status, status_step: step,
    eta_minutes: eta, rating: o.rating ?? null,
    created_at: o.createdAt.toISOString(),
  };
}

const notifShape = z.object({
  id: z.number(), audience: z.string(), type: z.string(), title: z.string(),
  message: z.string(), is_read: z.boolean(), order_id: z.string().nullable(),
  product_id: z.number().nullable(), created_at: z.string(),
});

export const Actions = {
  seedCatalog: defineAction({
    description: "Seeds the Fatafat catalog, areas, profile and addresses into the database if they are not there yet (idempotent).",
    request: z.object({}),
    response: z.object({ seeded: z.boolean(), products: z.number() }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select({ id: schema.products.id }).from(schema.products);
      return { seeded: true, products: rows.length };
    },
  }),

  getBootstrap: defineAction({
    description: "Returns everything the storefront needs on load: products with live stock, areas, profile, addresses, wishlist and unread notification count — all from the database.",
    request: z.object({}),
    response: z.object({
      products: z.array(productShape),
      areas: z.array(z.object({
        id: z.string(), name: z.string(), dist_km: z.number(), serviceable: z.boolean(),
        store_name: z.string(), store_type: z.string(), eta: z.string(),
        unavailable_ids: z.array(z.number()),
      })),
      profile: z.object({ name: z.string(), phone: z.string(), current_area_id: z.string(), referral_code: z.string(), referred_by: z.string(), coins: z.number(), is_guest: z.boolean() }),
      subscriptions: z.array(z.object({
        id: z.number(), product_id: z.number(), product_name: z.string(), weight: z.string(),
        price: z.number(), frequency: z.string(), qty: z.number(), status: z.string(),
        created_at: z.string(),
      })),
      coin_history: z.array(z.object({
        id: z.number(), kind: z.string(), amount: z.number(), note: z.string(),
        order_id: z.string().nullable(), created_at: z.string(),
      })),
      addresses: z.array(z.object({ id: z.number(), label: z.string(), text: z.string(), is_active: z.boolean() })),
      wishlist_ids: z.array(z.number()),
      notify_ids: z.array(z.number()),
      unread_notifications: z.number(),
      active_order_id: z.string().nullable(),
      settings: z.object({ delivery_charge: z.number(), free_threshold: z.number(), geofence_km: z.number() }),
    }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      await ensureLoyalty(ctx);
      const settings = await getSettings(ctx);
      const { account, isGuest } = await currentContext(ctx);
      const db = ctx.db<typeof schema>();
      const prods = await db.select().from(schema.products).orderBy(asc(schema.products.sortOrder));
      const areaRows = await db.select().from(schema.areas);
      const subRows = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.accountId, account.id)).orderBy(desc(schema.subscriptions.id));
      const ledgerRows = await db.select().from(schema.coinLedger).where(eq(schema.coinLedger.accountId, account.id)).orderBy(desc(schema.coinLedger.id)).limit(20);
      const addrs = await db.select().from(schema.addresses).where(eq(schema.addresses.accountId, account.id)).orderBy(asc(schema.addresses.id));
      const wish = await db.select().from(schema.wishlist).where(eq(schema.wishlist.accountId, account.id));
      const notifyRows = await db.select().from(schema.notifyMe).where(eq(schema.notifyMe.accountId, account.id));
      const agg = reviewAgg(await db.select().from(schema.reviews));
      const unread = await db.select({ id: schema.notifications.id }).from(schema.notifications)
        .where(sql`${schema.notifications.isRead} = 0 AND ${schema.notifications.audience} = 'customer'`);
      const orderRows = await db.select().from(schema.orders).where(eq(schema.orders.accountId, account.id)).orderBy(desc(schema.orders.createdAt)).limit(10);
      const active = orderRows.map(toOrder).find((o) => o.status !== "delivered" && o.status !== "cancelled");
      return {
        products: prods.map((p) => toProduct(p, agg)),
        areas: areaRows.map((a) => {
          let ids: number[] = [];
          try { const v: unknown = JSON.parse(a.unavailableIds); if (Array.isArray(v)) ids = v as number[]; } catch { ids = []; }
          return {
            id: a.id, name: a.name, dist_km: a.distKm, serviceable: a.distKm <= settings.geofenceKm,
            store_name: a.storeName, store_type: a.storeType, eta: a.eta, unavailable_ids: ids,
          };
        }),
        profile: {
          name: account.name, phone: account.phone, current_area_id: account.currentAreaId,
          referral_code: account.referralCode, referred_by: account.referredBy, coins: account.coins,
          is_guest: isGuest,
        },
        subscriptions: subRows.map((s) => {
          const prod = prods.find((x) => x.id === s.productId);
          return {
            id: s.id, product_id: s.productId, product_name: prod?.name ?? "Product",
            weight: prod?.weight ?? "", price: prod?.price ?? 0,
            frequency: s.frequency, qty: s.qty, status: s.status,
            created_at: s.createdAt.toISOString(),
          };
        }),
        coin_history: ledgerRows.map((l) => ({
          id: l.id, kind: l.kind, amount: l.amount, note: l.note,
          order_id: l.orderId ?? null, created_at: l.createdAt.toISOString(),
        })),
        addresses: addrs.map((a) => ({ id: a.id, label: a.label, text: a.text, is_active: a.isActive === 1 })),
        wishlist_ids: wish.map((w) => w.productId),
        notify_ids: notifyRows.map((n) => n.productId),
        unread_notifications: unread.length,
        active_order_id: active?.id ?? null,
        settings: {
          delivery_charge: settings.deliveryCharge,
          free_threshold: settings.freeThreshold,
          geofence_km: settings.geofenceKm,
        },
      };
    },
  }),

  getSearchSuggestions: defineAction({
    description: "Server-side search suggestions: matching brands and top products for a query (Hindi + English names).",
    request: z.object({ query: z.string().max(60) }),
    response: z.object({
      brands: z.array(z.string()),
      products: z.array(productShape),
    }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const prods = await db.select().from(schema.products).orderBy(asc(schema.products.sortOrder));
      const agg = reviewAgg(await db.select().from(schema.reviews));
      const q = args.query.trim().toLowerCase();
      const matches = (p: (typeof prods)[number]) =>
        q === "" || p.name.toLowerCase().includes(q) || p.hi.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matched = prods.filter(matches);
      let brands = [...new Set(matched.map((p) => p.brand))].slice(0, 5);
      if (q === "milk" || q === "doodh") brands = ["Amul", "Britannia", "Farm Fresh"];
      return {
        brands,
        products: matched.slice(0, 5).map((p) => toProduct(p, agg)),
      };
    },
  }),

  validateCoupon: defineAction({
    description: "Validates a coupon code against a subtotal on the server and returns the discount.",
    request: z.object({ code: z.string().trim().min(1).max(20), subtotal: z.number().int().min(0) }),
    response: z.object({
      ok: z.boolean(), code: z.string(), discount: z.number(),
      label: z.string(), message: z.string(),
    }),
    async handler(ctx, args) {
      const code = args.code.toUpperCase();
      const r = await findCoupon(ctx, code);
      if (!r.found) {
        return {
          ok: false, code, discount: 0, label: "",
          message: r.reason === "disabled" ? `Coupon ${code} abhi admin ne band kiya hua hai.` : "Ye coupon code sahi nahi hai.",
        };
      }
      if (args.subtotal < r.min) {
        return { ok: false, code, discount: 0, label: r.label, message: `${code} ke liye kam se kam ₹${r.min} ka order chahiye (abhi ₹${args.subtotal}).` };
      }
      return { ok: true, code, discount: r.off, label: r.label, message: `${r.label} lag gaya — ₹${r.off} ki bachat!` };
    },
  }),

  placeOrder: defineAction({
    description: "Places an order: validates area geofence and live stock on the server, decrements stock, saves the order, and creates customer, staff and vendor notifications.",
    request: z.object({
      items: z.array(z.object({ product_id: z.number().int().positive(), qty: z.number().int().min(1).max(50) })).min(1).max(50),
      customer_name: z.string().trim().min(2).max(60),
      phone: z.string().trim().min(10).max(20),
      address_label: z.string().max(40),
      address_text: z.string().trim().min(8).max(300),
      area_id: z.string().min(1).max(40),
      coupon_code: z.string().max(20).default(""),
      use_coins: z.boolean().default(false),
      payment_method: z.enum(["cod", "upi", "card", "wallet"]),
      payment_detail: z.string().max(80).default(""),
      instructions: z.string().max(300).default(""),
      delivery_slot: z.string().max(60).default("Abhi — 8 minutes me"),
      is_gift: z.boolean().default(false),
      gift_name: z.string().max(60).default(""),
      gift_phone: z.string().max(20).default(""),
      gift_note: z.string().max(200).default(""),
    }),
    response: z.object({
      ok: z.boolean(), order: orderShape.nullable(), error: z.string(),
    }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const settings = await getSettings(ctx);
      const db = ctx.db<typeof schema>();
      const fail = (error: string) => ({ ok: false, order: null, error });

      const digits = args.phone.replace(/\D/g, "");
      const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
      if (!/^[6-9]\d{9}$/.test(local)) return fail("Sahi 10-digit mobile number likho (6–9 se shuru). +91 wala bhi chalega.");

      const areaRows = await db.select().from(schema.areas).where(eq(schema.areas.id, args.area_id)).limit(1);
      const area = areaRows[0];
      if (!area) return fail("Ye area nahi mila — doosra area chuno.");
      if (area.distKm > settings.geofenceKm) return fail(`⚠ ${area.name} ${settings.geofenceKm} km delivery radius ke bahar hai (${area.distKm} km) — yaha order nahi ho sakta.`);
      let unavailable: number[] = [];
      try { const v: unknown = JSON.parse(area.unavailableIds); if (Array.isArray(v)) unavailable = v as number[]; } catch { unavailable = []; }

      const prods = await db.select().from(schema.products);
      const byId = new Map(prods.map((p) => [p.id, p]));
      type Line = { product_id: number; name: string; weight: string; price: number; qty: number };
      const lines: Line[] = [];
      let subtotal = 0;
      let itemsCount = 0;
      for (const it of args.items) {
        const p = byId.get(it.product_id);
        if (!p) return fail("Ek item catalog me nahi mila — cart refresh karo.");
        if (unavailable.includes(p.id)) return fail(`"${p.name}" is area ke store me available nahi hai.`);
        if (p.stock < it.qty) return fail(`"${p.name}" ka stock sirf ${p.stock} bacha hai — quantity kam karo.`);
        lines.push({ product_id: p.id, name: p.name, weight: p.weight, price: p.price, qty: it.qty });
        subtotal += p.price * it.qty;
        itemsCount += it.qty;
      }

      let discount = 0;
      const code = args.coupon_code.trim().toUpperCase();
      if (code) {
        const r = await findCoupon(ctx, code);
        if (!r.found) return fail(r.reason === "disabled" ? `Coupon ${code} abhi band hai.` : "Coupon code galat hai.");
        if (subtotal < r.min) return fail(`${code} ke liye kam se kam ₹${r.min} ka order chahiye.`);
        discount = r.off;
      }
      const deliveryFee = subtotal >= settings.freeThreshold ? 0 : settings.deliveryCharge;
      const payableBeforeCoins = Math.max(0, subtotal - discount) + deliveryFee;

      // Fatafat Coins: 1 coin = ₹1. Redeem is capped at the payable amount;
      // the order then earns 5% of the final paid total back as new coins.
      // All amounts are computed here on the server from DB prices — the
      // client's displayed totals are never trusted.
      const { account } = await currentContext(ctx);
      const walletCoins = account.coins;
      const coinsRedeemed = args.use_coins ? Math.min(walletCoins, payableBeforeCoins) : 0;
      const grand = payableBeforeCoins - coinsRedeemed;
      const coinsEarned = Math.floor(grand * 0.05);

      const now = new Date();
      const orderId = `FF${now.getTime().toString().slice(-8)}`;
      const payLabels: Record<string, string> = { cod: "Cash on Delivery", upi: "UPI", card: "Card", wallet: "Wallet" };

      const stmts: BatchItem<"sqlite">[] = [];
      stmts.push(
        db.insert(schema.orders).values({
          id: orderId, accountId: account.id, customerName: args.customer_name, phone: args.phone,
          addressLabel: args.address_label, addressText: args.address_text,
          areaId: area.id, areaName: area.name,
          items: JSON.stringify(lines), itemsCount, subtotal, discount,
          deliveryFee, grandTotal: grand, couponCode: code,
          coinsRedeemed, coinsEarned,
          paymentMethod: args.payment_method,
          paymentDetail: args.payment_detail || payLabels[args.payment_method] || "",
          instructions: args.instructions,
          deliverySlot: args.delivery_slot || "Abhi — 8 minutes me",
          isGift: args.is_gift ? 1 : 0,
          giftName: args.is_gift ? args.gift_name : "",
          giftPhone: args.is_gift ? args.gift_phone : "",
          giftNote: args.is_gift ? args.gift_note : "",
          status: "placed", statusStep: 0,
          rating: null, createdAt: now,
        }),
      );
      for (const line of lines) {
        stmts.push(
          db.update(schema.products)
            .set({ stock: sql`${schema.products.stock} - ${line.qty}` })
            .where(eq(schema.products.id, line.product_id)),
        );
      }
      const itemSummary = lines.map((l) => `${l.name} ×${l.qty}`).join(", ");
      stmts.push(
        db.insert(schema.notifications).values({
          audience: "customer", type: "order", orderId,
          title: `✅ Order ${orderId} Place Ho Gaya!`,
          message: `${itemsCount} items · ₹${grand} · ${area.storeName} se packing shuru hogi.`,
          isRead: 0, createdAt: now,
        }),
      );
      if (coinsRedeemed > 0 || coinsEarned > 0) {
        stmts.push(
          db.update(schema.accounts)
            .set({ coins: walletCoins - coinsRedeemed + coinsEarned })
            .where(eq(schema.accounts.id, account.id)),
        );
      }
      if (coinsRedeemed > 0) {
        stmts.push(
          db.insert(schema.coinLedger).values({
            accountId: account.id,
            kind: "redeem", amount: -coinsRedeemed, orderId,
            note: `Order ${orderId} ke bill me coins use hue`,
            createdAt: now,
          }),
        );
      }
      if (coinsEarned > 0) {
        stmts.push(
          db.insert(schema.coinLedger).values({
            accountId: account.id,
            kind: "earn", amount: coinsEarned, orderId,
            note: `Order ${orderId} par 5% cashback coins mile`,
            createdAt: now,
          }),
        );
      }
      stmts.push(
        db.insert(schema.notifications).values({
          audience: "staff", type: "staff", orderId,
          title: `🏪 Order Aaya Hai — Jaldi Pack Karo! (${orderId})`,
          message: `${area.storeName}: ${itemSummary}. Customer: ${args.customer_name}. Slot: ${args.delivery_slot || "Abhi"}.${args.is_gift ? ` 🎁 GIFT — ${args.gift_name} (${args.gift_phone})${args.gift_note ? ": " + args.gift_note : ""}` : ""} ${args.instructions ? "Note: " + args.instructions : ""}`,
          isRead: 0, createdAt: now,
        }),
      );
      // Vendor low-stock alerts for anything that dropped to 5 or below.
      for (const line of lines) {
        const p = byId.get(line.product_id);
        if (!p) continue;
        const left = p.stock - line.qty;
        if (left <= 5) {
          const who = p.source === "vendor" ? p.vendor : "Fatafat Dark Store";
          stmts.push(
            db.insert(schema.notifications).values({
              audience: "vendor", type: "vendor", orderId, productId: p.id,
              title: `⚠️ Low Stock Alert — ${p.name}`,
              message: `${who}: sirf ${left} bache hain. Jaldi restock karo${left === 0 ? " — item ab Out of Stock hai!" : "!"}`,
              isRead: 0, createdAt: now,
            }),
          );
        }
      }
      const [first, ...rest] = stmts;
      if (first) await db.batch([first, ...rest]);
      ctx.invalidateQueries();

      const saved = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
      const row = saved[0];
      return { ok: true, order: row ? toOrder(row) : null, error: "" };
    },
  }),

  listOrders: defineAction({
    description: "Lists all orders from the database, newest first, with live tracking status computed from elapsed time and staff advances.",
    request: z.object({ limit: z.number().int().positive().max(50).default(20) }),
    response: z.object({ orders: z.array(orderShape) }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.orders).where(eq(schema.orders.accountId, account.id)).orderBy(desc(schema.orders.createdAt)).limit(args.limit);
      return { orders: rows.map(toOrder) };
    },
  }),

  getOrder: defineAction({
    description: "Returns one order with its current live tracking status.",
    request: z.object({ order_id: z.string().min(1).max(40) }),
    response: z.object({ order: orderShape.nullable() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, args.order_id)).limit(1);
      const row = rows[0];
      return { order: row ? toOrder(row) : null };
    },
  }),

  advanceOrder: defineAction({
    description: "Store-staff action: advances an order one tracking step (packing → on the way → delivered) and notifies the customer.",
    request: z.object({ order_id: z.string().min(1).max(40) }),
    response: z.object({ ok: z.boolean(), order: orderShape.nullable(), error: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, args.order_id)).limit(1);
      const row = rows[0];
      if (!row) return { ok: false, order: null, error: "Order nahi mila." };
      if (row.status === "cancelled") return { ok: false, order: toOrder(row), error: "Cancelled order aage nahi badh sakta." };
      const cur = effectiveStep(row);
      const next = Math.min(3, cur + 1);
      const status = STATUS_STEPS[next] ?? "delivered";
      await db.batch([
        db.update(schema.orders).set({ statusStep: next, status }).where(eq(schema.orders.id, row.id)),
        db.insert(schema.notifications).values({
          audience: "customer", type: "order", orderId: row.id,
          title: status === "delivered" ? `🎉 Order ${row.id} Delivered!` : `🛵 Order ${row.id} — ${STATUS_LABELS[status]}`,
          message: status === "delivered" ? "Tumhara samaan pahunch gaya. Rating dena mat bhoolna!" : `Status update: ${STATUS_LABELS[status]}.`,
          isRead: 0, createdAt: new Date(),
        }),
      ]);
      ctx.invalidateQueries();
      const saved = await db.select().from(schema.orders).where(eq(schema.orders.id, row.id)).limit(1);
      const s = saved[0];
      return { ok: true, order: s ? toOrder(s) : null, error: "" };
    },
  }),

  cancelOrder: defineAction({
    description: "Cancels an order that is not delivered yet and restores its stock to the inventory.",
    request: z.object({ order_id: z.string().min(1).max(40) }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, args.order_id)).limit(1);
      const row = rows[0];
      if (!row) return { ok: false, error: "Order nahi mila." };
      const live = toOrder(row);
      if (live.status === "delivered") return { ok: false, error: "Delivered order cancel nahi ho sakta." };
      if (row.status === "cancelled") return { ok: false, error: "Ye order pehle se cancelled hai." };
      const stmts: BatchItem<"sqlite">[] = [
        db.update(schema.orders).set({ status: "cancelled" }).where(eq(schema.orders.id, row.id)),
      ];
      for (const line of live.items) {
        stmts.push(
          db.update(schema.products)
            .set({ stock: sql`${schema.products.stock} + ${line.qty}` })
            .where(eq(schema.products.id, line.product_id)),
        );
      }
      if (row.coinsRedeemed > 0 || row.coinsEarned > 0) {
        stmts.push(
          db.update(schema.accounts)
            .set({ coins: sql`MAX(0, ${schema.accounts.coins} + ${row.coinsRedeemed} - ${row.coinsEarned})` })
            .where(eq(schema.accounts.id, row.accountId)),
        );
        if (row.coinsRedeemed > 0) {
          stmts.push(
            db.insert(schema.coinLedger).values({
              accountId: row.accountId,
              kind: "refund", amount: row.coinsRedeemed, orderId: row.id,
              note: `Order ${row.id} cancel — redeemed coins wapas mile`,
              createdAt: new Date(),
            }),
          );
        }
        if (row.coinsEarned > 0) {
          stmts.push(
            db.insert(schema.coinLedger).values({
              accountId: row.accountId,
              kind: "refund", amount: -row.coinsEarned, orderId: row.id,
              note: `Order ${row.id} cancel — earned coins wapas liye gaye`,
              createdAt: new Date(),
            }),
          );
        }
      }
      stmts.push(
        db.insert(schema.notifications).values({
          audience: "customer", type: "order", orderId: row.id,
          title: `❌ Order ${row.id} Cancel Ho Gaya`,
          message: "Stock wapas inventory me add ho gaya hai. Kuch aur chahiye to phir order karo!",
          isRead: 0, createdAt: new Date(),
        }),
      );
      stmts.push(
        db.insert(schema.notifications).values({
          audience: "staff", type: "staff", orderId: row.id,
          title: `🚫 Order Cancel — ${row.id}`,
          message: "Customer ne order cancel kar diya. Packing rok do, stock wapas lag gaya hai.",
          isRead: 0, createdAt: new Date(),
        }),
      );
      const [first, ...rest] = stmts;
      if (first) await db.batch([first, ...rest]);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  rateOrder: defineAction({
    description: "Saves a 1–5 star rating on a delivered order.",
    request: z.object({ order_id: z.string().min(1).max(40), rating: z.number().int().min(1).max(5) }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      await db.update(schema.orders).set({ rating: args.rating }).where(eq(schema.orders.id, args.order_id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  listNotifications: defineAction({
    description: "Lists notifications from the database, optionally filtered by audience (customer, staff, vendor), newest first.",
    request: z.object({ audience: z.enum(["customer", "staff", "vendor", "all"]).default("all"), limit: z.number().int().positive().max(100).default(50) }),
    response: z.object({ notifications: z.array(notifShape) }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const base = db.select().from(schema.notifications);
      const rows = args.audience === "all"
        ? await base.orderBy(desc(schema.notifications.id)).limit(args.limit)
        : await base.where(eq(schema.notifications.audience, args.audience)).orderBy(desc(schema.notifications.id)).limit(args.limit);
      return {
        notifications: rows.map((n) => ({
          id: n.id, audience: n.audience, type: n.type, title: n.title, message: n.message,
          is_read: n.isRead === 1, order_id: n.orderId ?? null, product_id: n.productId ?? null,
          created_at: n.createdAt.toISOString(),
        })),
      };
    },
  }),

  markNotificationsRead: defineAction({
    description: "Marks all customer notifications as read.",
    request: z.object({}),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      await db.update(schema.notifications).set({ isRead: 1 }).where(eq(schema.notifications.audience, "customer"));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  toggleWishlist: defineAction({
    description: "Adds or removes a product from the logged-in account's saved wishlist in the database.",
    request: z.object({ product_id: z.number().int().positive() }),
    response: z.object({ wishlisted: z.boolean() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.wishlist)
        .where(sql`${schema.wishlist.accountId} = ${account.id} AND ${schema.wishlist.productId} = ${args.product_id}`).limit(1);
      if (existing.length > 0) {
        await db.delete(schema.wishlist)
          .where(sql`${schema.wishlist.accountId} = ${account.id} AND ${schema.wishlist.productId} = ${args.product_id}`);
        ctx.invalidateQueries();
        return { wishlisted: false };
      }
      await db.insert(schema.wishlist).values({ accountId: account.id, productId: args.product_id });
      ctx.invalidateQueries();
      return { wishlisted: true };
    },
  }),

  updateProfile: defineAction({
    description: "Saves the logged-in account's name and phone number to the database.",
    request: z.object({ name: z.string().trim().min(2).max(60), phone: z.string().trim().min(10).max(20) }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const local = normalizePhone(args.phone);
      if (!local) return { ok: false, error: "Sahi 10-digit mobile number likho." };
      const { account } = await currentContext(ctx);
      const db = ctx.db<typeof schema>();
      const clash = await findAccountByPhone(ctx, local);
      if (clash && clash.id !== account.id) return { ok: false, error: "Ye mobile number kisi aur account par registered hai." };
      await db.update(schema.accounts)
        .set({ name: args.name, phone: args.phone, referralCode: referralCodeFor(args.name, args.phone) })
        .where(eq(schema.accounts.id, account.id));
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  applyReferralCode: defineAction({
    description: "Applies a friend's referral code: the user gets ₹50 in Fatafat Coins (tracked in the wallet ledger) and the code owner is credited too; each profile can use a referral code only once.",
    request: z.object({ code: z.string().trim().min(3).max(30) }),
    response: z.object({ ok: z.boolean(), coins: z.number(), error: z.string() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account: p } = await currentContext(ctx);
      const db = ctx.db<typeof schema>();
      const code = args.code.trim().toUpperCase();
      if (p.referredBy) return { ok: false, coins: p.coins, error: "Tum pehle hi ek referral code use kar chuke ho — har user ko bonus sirf ek baar milta hai." };
      if (code === p.referralCode.toUpperCase()) return { ok: false, coins: p.coins, error: "Apna khud ka code use nahi kar sakte — dost ka code daalo." };
      const now = new Date();
      const newCoins = p.coins + 50;
      await db.batch([
        db.update(schema.accounts).set({ referredBy: code, coins: newCoins }).where(eq(schema.accounts.id, p.id)),
        db.insert(schema.coinLedger).values({
          accountId: p.id,
          kind: "referral", amount: 50,
          note: `Referral bonus — dost ke code ${code} se ₹50 ke coins mile (code wale dost ko bhi ₹50 credit ho gaya)`,
          createdAt: now,
        }),
        db.insert(schema.notifications).values({
          audience: "customer", type: "offer",
          title: "🎁 Referral Bonus Mil Gaya!",
          message: `Code ${code} lagane par tumhe 50 Fatafat Coins (₹50) mile aur code wale dost ko bhi ₹50 credit ho gaya. Coins checkout par bill me use kar sakte ho.`,
          isRead: 0, createdAt: now,
        }),
      ]);
      ctx.invalidateQueries();
      return { ok: true, coins: newCoins, error: "" };
    },
  }),

  createSubscription: defineAction({
    description: "Creates a product subscription (daily or weekly delivery schedule) stored in the database.",
    request: z.object({
      product_id: z.number().int().positive(),
      frequency: z.enum(["daily", "weekly"]),
      qty: z.number().int().min(1).max(10),
    }),
    response: z.object({ ok: z.boolean(), id: z.number(), error: z.string() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db<typeof schema>();
      const prods = await db.select().from(schema.products).where(eq(schema.products.id, args.product_id)).limit(1);
      const prod = prods[0];
      if (!prod) return { ok: false, id: 0, error: "Product nahi mila." };
      const existing = await db.select().from(schema.subscriptions)
        .where(sql`${schema.subscriptions.accountId} = ${account.id} AND ${schema.subscriptions.productId} = ${args.product_id} AND ${schema.subscriptions.status} != 'cancelled'`);
      if (existing.length > 0) return { ok: false, id: 0, error: `"${prod.name}" ki subscription pehle se hai — My Subscriptions me dekho.` };
      const now = new Date();
      const inserted = await db.insert(schema.subscriptions).values({
        accountId: account.id,
        productId: args.product_id, frequency: args.frequency, qty: args.qty,
        status: "active", createdAt: now,
      }).returning({ id: schema.subscriptions.id });
      await db.insert(schema.notifications).values({
        audience: "customer", type: "offer",
        title: `🔄 Subscription Shuru — ${prod.name}`,
        message: `${args.frequency === "daily" ? "Roz" : "Har hafte"} ${args.qty} × ${prod.name} (${prod.weight}) tumhare subscription plan me add ho gaya. Profile → My Subscriptions se pause/cancel kar sakte ho.`,
        isRead: 0, createdAt: now,
      });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0, error: "" };
    },
  }),

  setSubscriptionStatus: defineAction({
    description: "Pauses, resumes or cancels a product subscription.",
    request: z.object({ subscription_id: z.number().int().positive(), status: z.enum(["active", "paused", "cancelled"]) }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      const { account } = await currentContext(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.id, args.subscription_id)).limit(1);
      const sub = rows[0];
      if (!sub) return { ok: false, error: "Subscription nahi mili." };
      if (sub.accountId !== account.id) return { ok: false, error: "Ye subscription tumhare account ki nahi hai." };
      if (sub.status === "cancelled") return { ok: false, error: "Cancelled subscription dobara change nahi hoti." };
      await db.update(schema.subscriptions).set({ status: args.status }).where(eq(schema.subscriptions.id, sub.id));
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  setCurrentArea: defineAction({
    description: "Saves the customer's selected delivery area (used for geofencing and store assignment).",
    request: z.object({ area_id: z.string().min(1).max(40) }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db<typeof schema>();
      await db.update(schema.accounts).set({ currentAreaId: args.area_id }).where(eq(schema.accounts.id, account.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  addAddress: defineAction({
    description: "Adds a new saved delivery address to the logged-in account and makes it the active one.",
    request: z.object({ label: z.string().trim().min(2).max(40), text: z.string().trim().min(8).max(300) }),
    response: z.object({ ok: z.boolean(), id: z.number() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db<typeof schema>();
      await db.update(schema.addresses).set({ isActive: 0 }).where(eq(schema.addresses.accountId, account.id));
      const inserted = await db.insert(schema.addresses).values({ accountId: account.id, label: args.label, text: args.text, isActive: 1 })
        .returning({ id: schema.addresses.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    },
  }),

  selectAddress: defineAction({
    description: "Makes one of the logged-in account's saved addresses the active delivery address.",
    request: z.object({ address_id: z.number().int().positive() }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const { account } = await currentContext(ctx);
      const db = ctx.db<typeof schema>();
      await db.batch([
        db.update(schema.addresses).set({ isActive: 0 }).where(eq(schema.addresses.accountId, account.id)),
        db.update(schema.addresses).set({ isActive: 1 })
          .where(sql`${schema.addresses.id} = ${args.address_id} AND ${schema.addresses.accountId} = ${account.id}`),
      ]);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  restockProduct: defineAction({
    description: "Store-staff action: adds stock back to a product (inventory management), clears its out-of-stock state, and notifies customers who tapped Notify Me for it.",
    request: z.object({ product_id: z.number().int().positive(), add_qty: z.number().int().min(1).max(500) }),
    response: z.object({ ok: z.boolean(), new_stock: z.number(), notified: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const before = await db.select().from(schema.products).where(eq(schema.products.id, args.product_id)).limit(1);
      const prod = before[0];
      await db.update(schema.products)
        .set({ stock: sql`${schema.products.stock} + ${args.add_qty}` })
        .where(eq(schema.products.id, args.product_id));
      const rows = await db.select().from(schema.products).where(eq(schema.products.id, args.product_id)).limit(1);
      const newStock = rows[0]?.stock ?? 0;
      // Notify Me: if the product was out of stock and someone subscribed,
      // send them a customer notification and clear the subscription.
      let notified = false;
      if (prod && prod.stock <= 0 && newStock > 0) {
        const subs = await db.select().from(schema.notifyMe).where(eq(schema.notifyMe.productId, args.product_id));
        if (subs.length > 0) {
          await db.batch([
            db.insert(schema.notifications).values({
              audience: "customer", type: "offer", productId: args.product_id,
              title: `🔔 Wapas Aa Gaya — ${prod.name}!`,
              message: `Tumne Notify Me dabya tha — ${prod.name} (${prod.weight}) phir se stock me hai (${newStock} units). Jaldi order karo, phir khatm ho jayega!`,
              isRead: 0, createdAt: new Date(),
            }),
            db.delete(schema.notifyMe).where(eq(schema.notifyMe.productId, args.product_id)),
          ]);
          notified = true;
        }
      }
      ctx.invalidateQueries();
      return { ok: true, new_stock: newStock, notified };
    },
  }),

  getStaffSummary: defineAction({
    description: "Store-staff dashboard data from the database: pending orders to pack, low-stock products, and total order count.",
    request: z.object({}),
    response: z.object({
      pending_orders: z.array(orderShape),
      low_stock: z.array(z.object({ id: z.number(), name: z.string(), stock: z.number(), source: z.string(), vendor: z.string() })),
      total_orders: z.number(),
      total_revenue: z.number(),
    }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(50);
      const live = rows.map(toOrder);
      const prods = await db.select().from(schema.products).orderBy(asc(schema.products.stock));
      return {
        pending_orders: live.filter((o) => o.status === "placed" || o.status === "packing"),
        low_stock: prods.filter((p) => p.stock <= 5).map((p) => ({ id: p.id, name: p.name, stock: p.stock, source: p.source, vendor: p.vendor })),
        total_orders: rows.length,
        total_revenue: rows.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.grandTotal, 0),
      };
    },
  }),

  getProductReviews: defineAction({
    description: "Returns all customer reviews for one product plus the average rating and count.",
    request: z.object({ product_id: z.number().int().positive() }),
    response: z.object({
      reviews: z.array(z.object({
        id: z.number(), author: z.string(), rating: z.number(), text: z.string(), created_at: z.string(),
      })),
      average: z.number(), count: z.number(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.reviews)
        .where(eq(schema.reviews.productId, args.product_id))
        .orderBy(desc(schema.reviews.id)).limit(50);
      const count = rows.length;
      const average = count ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
      return {
        reviews: rows.map((r) => ({
          id: r.id, author: r.author, rating: r.rating, text: r.text,
          created_at: r.createdAt.toISOString(),
        })),
        average, count,
      };
    },
  }),

  addReview: defineAction({
    description: "Saves a customer's star rating and written review for a product; the product card then shows the real average.",
    request: z.object({
      product_id: z.number().int().positive(),
      author: z.string().trim().min(2).max(40),
      rating: z.number().int().min(1).max(5),
      text: z.string().trim().min(3).max(400),
    }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const prods = await db.select().from(schema.products).where(eq(schema.products.id, args.product_id)).limit(1);
      if (!prods[0]) return { ok: false, error: "Product nahi mila." };
      await db.insert(schema.reviews).values({
        productId: args.product_id, author: args.author, rating: args.rating,
        text: args.text, createdAt: new Date(),
      });
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  toggleNotifyMe: defineAction({
    description: "Subscribes or unsubscribes the customer to a back-in-stock alert for an out-of-stock product; staff restock then sends them a notification.",
    request: z.object({ product_id: z.number().int().positive() }),
    response: z.object({ subscribed: z.boolean() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.notifyMe)
        .where(sql`${schema.notifyMe.accountId} = ${account.id} AND ${schema.notifyMe.productId} = ${args.product_id}`).limit(1);
      if (existing.length > 0) {
        await db.delete(schema.notifyMe)
          .where(sql`${schema.notifyMe.accountId} = ${account.id} AND ${schema.notifyMe.productId} = ${args.product_id}`);
        ctx.invalidateQueries();
        return { subscribed: false };
      }
      await db.insert(schema.notifyMe).values({ accountId: account.id, productId: args.product_id });
      ctx.invalidateQueries();
      return { subscribed: true };
    },
  }),

  aiAssistant: defineAction({
    description: "AI order assistant: reads a free-text request (Hindi/English, e.g. 'chai ka samaan bhej do' or '2 doodh aur bread') and matches real catalog products with quantities to build a cart.",
    request: z.object({ message: z.string().trim().min(2).max(300) }),
    response: z.object({
      reply: z.string(),
      items: z.array(z.object({
        product_id: z.number(), name: z.string(), weight: z.string(),
        price: z.number(), qty: z.number(), stock: z.number(),
      })),
    }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const prods = await db.select().from(schema.products).orderBy(asc(schema.products.sortOrder));
      const inStock = prods.filter((p) => p.stock > 0);
      const catalog = inStock.map((p) => `${p.id}: ${p.name} (${p.hi}) — ${p.brand}, ${p.weight}, ₹${p.price}, stock ${p.stock}`).join("\n");
      const result = await ctx.inference.complete(
        `You are Fatafat's order assistant for an Indian grocery app. The customer wrote (Hindi/Hinglish/English): "${args.message}". Pick the catalog products that fulfil the request. Understand bundles: "chai ka samaan" = milk + tea + sugar-like staples available; "nashta" = bread/eggs/milk type items; quantities may be written as digits or words (do=2, teen=3, ek=1, aadha kilo style still = 1 pack). Only use product ids from the catalog. Reply in Hinglish, one short friendly sentence.\n\nCatalog:\n${catalog}`,
        {
          schema: z.object({
            reply: z.string(),
            items: z.array(z.object({ product_id: z.number(), qty: z.number() })),
          }),
        },
      );
      const byId = new Map(prods.map((p) => [p.id, p]));
      const seen = new Set<number>();
      const items: { product_id: number; name: string; weight: string; price: number; qty: number; stock: number }[] = [];
      for (const it of result.items) {
        const p = byId.get(it.product_id);
        if (!p || seen.has(p.id)) continue;
        seen.add(p.id);
        const qty = Math.max(1, Math.min(10, Math.floor(it.qty) || 1, p.stock));
        if (p.stock <= 0) continue;
        items.push({ product_id: p.id, name: p.name, weight: p.weight, price: p.price, qty, stock: p.stock });
      }
      return {
        reply: items.length ? result.reply : "Iske liye catalog me kuch match nahi mila — kuch aur likho, jaise '2 doodh aur bread' ya 'chai ka samaan'.",
        items,
      };
    },
  }),

  getSalesDashboard: defineAction({
    description: "Sales dashboard computed from real orders in the database: today's revenue and order count, totals, top-selling products and a 7-day revenue series for the chart.",
    request: z.object({}),
    response: z.object({
      today_revenue: z.number(), today_orders: z.number(),
      total_revenue: z.number(), total_orders: z.number(),
      top_products: z.array(z.object({ name: z.string(), qty: z.number(), revenue: z.number() })),
      daily: z.array(z.object({ label: z.string(), revenue: z.number(), orders: z.number() })),
    }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(500);
      const live = rows.filter((r) => r.status !== "cancelled");
      const now = new Date();
      const sameDay = (d: Date, ref: Date) => d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
      const today = live.filter((r) => sameDay(r.createdAt, now));
      const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
      for (const o of live) {
        const ord = toOrder(o);
        for (const line of ord.items) {
          const e = byProduct.get(line.name) ?? { name: line.name, qty: 0, revenue: 0 };
          e.qty += line.qty; e.revenue += line.price * line.qty;
          byProduct.set(line.name, e);
        }
      }
      const daily: { label: string; revenue: number; orders: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const dayRows = live.filter((r) => sameDay(r.createdAt, d));
        daily.push({
          label: d.toLocaleDateString("en-IN", { weekday: "short" }),
          revenue: dayRows.reduce((s, r) => s + r.grandTotal, 0),
          orders: dayRows.length,
        });
      }
      return {
        today_revenue: today.reduce((s, r) => s + r.grandTotal, 0),
        today_orders: today.length,
        total_revenue: live.reduce((s, r) => s + r.grandTotal, 0),
        total_orders: live.length,
        top_products: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
        daily,
      };
    },
  }),

  registerVendor: defineAction({
    description: "Vendor self-onboarding: a shopkeeper registers their store as a Fatafat partner vendor, saved in the database.",
    request: z.object({
      shop_name: z.string().trim().min(3).max(60),
      owner_name: z.string().trim().min(2).max(60),
      phone: z.string().trim().min(10).max(20),
      area: z.string().trim().min(2).max(60),
    }),
    response: z.object({ ok: z.boolean(), id: z.number(), error: z.string() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const digits = args.phone.replace(/\D/g, "");
      const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
      if (!/^[6-9]\d{9}$/.test(local)) return { ok: false, id: 0, error: "Sahi 10-digit mobile number likho." };
      const dup = await db.select().from(schema.vendors).where(eq(schema.vendors.shopName, args.shop_name)).limit(1);
      if (dup[0]) return { ok: false, id: 0, error: "Is naam ki dukaan pehle se registered hai." };
      const now = new Date();
      const inserted = await db.insert(schema.vendors).values({
        shopName: args.shop_name, ownerName: args.owner_name, phone: args.phone,
        area: args.area, createdAt: now,
      }).returning({ id: schema.vendors.id });
      await db.insert(schema.notifications).values({
        audience: "staff", type: "staff",
        title: `🏪 Naya Vendor Juda — ${args.shop_name}`,
        message: `${args.owner_name} (${args.area}) ne apni dukaan Fatafat partner ke roop me register ki. Ab wo apne products aur coupons khud add kar sakte hain.`,
        isRead: 0, createdAt: now,
      });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0, error: "" };
    },
  }),

  listVendors: defineAction({
    description: "Lists all registered partner vendors plus the built-in partner stores, newest first.",
    request: z.object({}),
    response: z.object({
      vendors: z.array(z.object({
        id: z.number(), shop_name: z.string(), owner_name: z.string(),
        phone: z.string(), area: z.string(), created_at: z.string(),
      })),
    }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.vendors).orderBy(desc(schema.vendors.id));
      return {
        vendors: rows.map((v) => ({
          id: v.id, shop_name: v.shopName, owner_name: v.ownerName,
          phone: v.phone, area: v.area, created_at: v.createdAt.toISOString(),
        })),
      };
    },
  }),

  vendorAddProduct: defineAction({
    description: "A registered vendor adds their own product to the live catalog (source = vendor), with price, MRP and starting stock.",
    request: z.object({
      vendor_name: z.string().trim().min(3).max(60),
      name: z.string().trim().min(3).max(80),
      weight: z.string().trim().min(2).max(30),
      price: z.number().int().min(1).max(100000),
      mrp: z.number().int().min(1).max(100000),
      category: z.enum(["fruits", "dairy", "snacks", "chocolates", "drinks", "bakery", "grocery", "care", "babypet", "frozen"]),
      stock: z.number().int().min(1).max(1000),
    }),
    response: z.object({ ok: z.boolean(), id: z.number(), error: z.string() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      if (args.mrp < args.price) return { ok: false, id: 0, error: "MRP price se kam nahi ho sakti." };
      const maxRow = await db.select({ m: sql<number>`MAX(${schema.products.id})` }).from(schema.products);
      const newId = (maxRow[0]?.m ?? 0) + 1;
      const off = args.mrp > args.price ? Math.round(((args.mrp - args.price) / args.mrp) * 100) : 0;
      await db.insert(schema.products).values({
        id: newId, name: args.name, hi: args.name, weight: args.weight,
        price: args.price, mrp: args.mrp, category: args.category,
        brand: args.vendor_name, stock: args.stock, source: "vendor", vendor: args.vendor_name,
        rating: 4.5, offPct: off,
        description: `${args.vendor_name} ke dwara add kiya gaya product — fresh aur quality-checked.`,
        bg: "#FFF1E6", icon: "🛍️", sortOrder: 1000 + newId,
      });
      await db.insert(schema.notifications).values({
        audience: "staff", type: "staff",
        title: `🛍️ Vendor Ne Product Add Kiya — ${args.name}`,
        message: `${args.vendor_name} ne "${args.name}" (${args.weight}) ₹${args.price} par catalog me add kiya, stock ${args.stock}.`,
        isRead: 0, createdAt: new Date(),
      });
      ctx.invalidateQueries();
      return { ok: true, id: newId, error: "" };
    },
  }),

  createVendorCoupon: defineAction({
    description: "A vendor creates their own coupon code (flat ₹ off above a minimum order); it works in the customer cart immediately.",
    request: z.object({
      vendor_name: z.string().trim().min(3).max(60),
      code: z.string().trim().min(4).max(20),
      off: z.number().int().min(5).max(2000),
      min_order: z.number().int().min(0).max(100000),
    }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const code = args.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (code.length < 4) return { ok: false, error: "Coupon code kam se kam 4 akshar/number ka rakho." };
      if (COUPONS[code]) return { ok: false, error: "Ye code Fatafat ka official coupon hai — doosra code chuno." };
      const dup = await db.select().from(schema.vendorCoupons).where(eq(schema.vendorCoupons.code, code)).limit(1);
      if (dup[0]) return { ok: false, error: "Ye coupon code pehle se bana hua hai — doosra code chuno." };
      await db.insert(schema.vendorCoupons).values({
        code, off: args.off, minOrder: args.min_order,
        vendorName: args.vendor_name, createdAt: new Date(),
      });
      await db.insert(schema.notifications).values({
        audience: "customer", type: "offer",
        title: `🎟️ Naya Coupon — ${code}`,
        message: `${args.vendor_name} ka naya coupon: ₹${args.min_order}+ ke order par ₹${args.off} OFF. Cart me code ${code} lagao!`,
        isRead: 0, createdAt: new Date(),
      });
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  listVendorCoupons: defineAction({
    description: "Lists all vendor-created coupons that customers can use in the cart.",
    request: z.object({}),
    response: z.object({
      coupons: z.array(z.object({
        id: z.number(), code: z.string(), off: z.number(), min_order: z.number(), vendor_name: z.string(),
      })),
    }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.vendorCoupons).orderBy(desc(schema.vendorCoupons.id));
      return {
        coupons: rows.map((c) => ({ id: c.id, code: c.code, off: c.off, min_order: c.minOrder, vendor_name: c.vendorName })),
      };
    },
  }),

  /* ================================================================== */
  /* ADMIN PANEL — PIN login + token-gated management actions. Every     */
  /* action below re-validates the session token on the server; the      */
  /* client alone can never grant access.                                */
  /* ================================================================== */

  adminLogin: defineAction({
    description: "Admin login: verifies the PIN against the salted hash stored on the server (never in client code). After 5 wrong tries the login locks for 5 minutes and the attempt is written to the activity log. On success returns a session token that auto-expires after 30 minutes of inactivity.",
    request: z.object({ pin: z.string().min(4).max(8) }),
    response: z.object({ ok: z.boolean(), token: z.string(), error: z.string(), locked_seconds: z.number() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      await ensureAdminSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.adminConfig).limit(1);
      const cfg = rows[0];
      if (!cfg) return { ok: false, token: "", error: "Admin setup nahi hua — page refresh karo.", locked_seconds: 0 };
      const now = Date.now();
      if (cfg.lockedUntil > now) {
        const secs = Math.ceil((cfg.lockedUntil - now) / 1000);
        await logActivity(ctx, "login_blocked", `Lock ke dauran login ki koshish hui — lock khulne me ${secs} second bache the.`);
        return { ok: false, token: "", error: `Login LOCKED hai — bahut zyada galat koshishen ho gayi. ${Math.ceil(secs / 60)} minute baad phir try karo.`, locked_seconds: secs };
      }
      const hash = await hashPin(args.pin, cfg.salt);
      if (hash !== cfg.pinHash) {
        const attempts = cfg.failedAttempts + 1;
        if (attempts >= ADMIN_MAX_ATTEMPTS) {
          await db.update(schema.adminConfig)
            .set({ failedAttempts: 0, lockedUntil: now + ADMIN_LOCK_MS })
            .where(eq(schema.adminConfig.id, cfg.id));
          await logActivity(ctx, "login_locked", `🚨 ${ADMIN_MAX_ATTEMPTS} baar lagatar galat admin PIN — login ${ADMIN_LOCK_MS / 60000} minute ke liye LOCK ho gaya. Koi PIN guess karne ki koshish kar raha tha.`);
          return { ok: false, token: "", error: "5 baar galat PIN! Security ke liye admin login 5 minute ke liye lock ho gaya hai.", locked_seconds: ADMIN_LOCK_MS / 1000 };
        }
        await db.update(schema.adminConfig).set({ failedAttempts: attempts }).where(eq(schema.adminConfig.id, cfg.id));
        await logActivity(ctx, "login_failed", `❌ Galat admin PIN ki koshish #${attempts} — lock hone tak ${ADMIN_MAX_ATTEMPTS - attempts} galti aur chalegi.`);
        return { ok: false, token: "", error: `Galat PIN — ${ADMIN_MAX_ATTEMPTS - attempts} koshish aur bachi hain, phir login lock ho jayega.`, locked_seconds: 0 };
      }
      await db.update(schema.adminConfig).set({ failedAttempts: 0, lockedUntil: 0 }).where(eq(schema.adminConfig.id, cfg.id));
      const token = randomHex(24);
      await db.insert(schema.adminSessions).values({ token, createdAt: new Date(now), expiresAt: new Date(now + ADMIN_SESSION_MS) });
      await logActivity(ctx, "login_success", "✅ Admin PIN se login hua — naya session bana (30 minute bina activity ke apne aap expire hoga).");
      return { ok: true, token, error: "", locked_seconds: 0 };
    },
  }),

  adminCheckSession: defineAction({
    description: "Checks whether an admin session token is still valid (used when the panel reopens); a valid check counts as activity and slides the 30-minute inactivity expiry.",
    request: z.object({ token: z.string().max(100) }),
    response: z.object({ valid: z.boolean() }),
    async handler(ctx, args) {
      await ensureAdminSeeded(ctx);
      return { valid: await requireAdmin(ctx, args.token) };
    },
  }),

  adminLogout: defineAction({
    description: "Admin logout: deletes the server-side session so the token stops working immediately, and logs the logout.",
    request: z.object({ token: z.string().min(1).max(100) }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, args.token));
      await logActivity(ctx, "logout", "🚪 Admin logout hua — session server se delete ho gaya.");
      return { ok: true };
    },
  }),

  adminDashboard: defineAction({
    description: "Admin dashboard overview computed live from the database: total revenue, orders, products, vendors, low-stock and out-of-stock counts, pending orders and outstanding Fatafat Coins.",
    request: z.object({ token: z.string().min(1).max(100) }),
    response: z.object({
      ok: z.boolean(), error: z.string(),
      total_revenue: z.number(), total_orders: z.number(), total_products: z.number(),
      total_vendors: z.number(), low_stock_count: z.number(), out_of_stock_count: z.number(),
      pending_orders: z.number(), coins_outstanding: z.number(),
    }),
    async handler(ctx, args) {
      const empty = { ok: false, error: SESSION_EXPIRED, total_revenue: 0, total_orders: 0, total_products: 0, total_vendors: 0, low_stock_count: 0, out_of_stock_count: 0, pending_orders: 0, coins_outstanding: 0 };
      if (!(await requireAdmin(ctx, args.token))) return empty;
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const orderRows = await db.select().from(schema.orders);
      const live = orderRows.map(toOrder);
      const prods = await db.select().from(schema.products);
      const vendorRows = await db.select().from(schema.vendors).where(sql`${schema.vendors.status} != 'removed'`);
      const accRows = await db.select().from(schema.accounts);
      return {
        ok: true, error: "",
        total_revenue: orderRows.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.grandTotal, 0),
        total_orders: orderRows.length,
        total_products: prods.length,
        total_vendors: vendorRows.length,
        low_stock_count: prods.filter((p) => p.stock > 0 && p.stock <= 5).length,
        out_of_stock_count: prods.filter((p) => p.stock <= 0).length,
        pending_orders: live.filter((o) => o.status === "placed" || o.status === "packing").length,
        coins_outstanding: accRows.reduce((s, a) => s + a.coins, 0),
      };
    },
  }),

  adminListProducts: defineAction({
    description: "Admin product management list: every catalog product with live stock, price and MRP (admin session required).",
    request: z.object({ token: z.string().min(1).max(100), query: z.string().max(60).default("") }),
    response: z.object({ ok: z.boolean(), error: z.string(), products: z.array(productShape) }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED, products: [] };
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const prods = await db.select().from(schema.products).orderBy(asc(schema.products.sortOrder));
      const agg = reviewAgg(await db.select().from(schema.reviews));
      const q = args.query.trim().toLowerCase();
      const filtered = q === "" ? prods : prods.filter((p) =>
        p.name.toLowerCase().includes(q) || p.hi.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
      return { ok: true, error: "", products: filtered.map((p) => toProduct(p, agg)) };
    },
  }),

  adminUpdateProduct: defineAction({
    description: "Admin edits a product's name, price, MRP and stock; the change is written to the database and recorded in the activity log (admin session required).",
    request: z.object({
      token: z.string().min(1).max(100),
      product_id: z.number().int().positive(),
      name: z.string().trim().min(3).max(80),
      price: z.number().int().min(1).max(100000),
      mrp: z.number().int().min(1).max(100000),
      stock: z.number().int().min(0).max(100000),
    }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED };
      if (args.mrp < args.price) return { ok: false, error: "MRP price se kam nahi ho sakti." };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.products).where(eq(schema.products.id, args.product_id)).limit(1);
      const old = rows[0];
      if (!old) return { ok: false, error: "Product nahi mila." };
      const off = args.mrp > args.price ? Math.round(((args.mrp - args.price) / args.mrp) * 100) : 0;
      await db.update(schema.products)
        .set({ name: args.name, price: args.price, mrp: args.mrp, stock: args.stock, offPct: off })
        .where(eq(schema.products.id, args.product_id));
      await logActivity(ctx, "product_edit",
        `✏️ Product edit: "${old.name}" → naam "${args.name}", price ₹${old.price} → ₹${args.price}, MRP ₹${old.mrp} → ₹${args.mrp}, stock ${old.stock} → ${args.stock}.`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  adminAddProduct: defineAction({
    description: "Admin adds a brand-new product directly to the live catalog (dark-store source) and logs it (admin session required).",
    request: z.object({
      token: z.string().min(1).max(100),
      name: z.string().trim().min(3).max(80),
      weight: z.string().trim().min(2).max(30),
      price: z.number().int().min(1).max(100000),
      mrp: z.number().int().min(1).max(100000),
      category: z.enum(["fruits", "dairy", "snacks", "chocolates", "drinks", "bakery", "grocery", "care", "babypet", "frozen"]),
      brand: z.string().trim().min(2).max(40),
      stock: z.number().int().min(0).max(100000),
    }),
    response: z.object({ ok: z.boolean(), id: z.number(), error: z.string() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, id: 0, error: SESSION_EXPIRED };
      if (args.mrp < args.price) return { ok: false, id: 0, error: "MRP price se kam nahi ho sakti." };
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const maxRow = await db.select({ m: sql<number>`MAX(${schema.products.id})` }).from(schema.products);
      const newId = (maxRow[0]?.m ?? 0) + 1;
      const off = args.mrp > args.price ? Math.round(((args.mrp - args.price) / args.mrp) * 100) : 0;
      await db.insert(schema.products).values({
        id: newId, name: args.name, hi: args.name, weight: args.weight,
        price: args.price, mrp: args.mrp, category: args.category,
        brand: args.brand, stock: args.stock, source: "dark", vendor: "",
        rating: 4.5, offPct: off,
        description: `${args.brand} ka ${args.name} — admin dwara catalog me add kiya gaya, quality-checked.`,
        bg: "#FFF1E6", icon: "🛒", sortOrder: 2000 + newId,
      });
      await logActivity(ctx, "product_add", `➕ Admin ne naya product add kiya: "${args.name}" (${args.weight}) ₹${args.price}, stock ${args.stock}.`);
      ctx.invalidateQueries();
      return { ok: true, id: newId, error: "" };
    },
  }),

  adminDeleteProduct: defineAction({
    description: "Admin deletes a product from the catalog (also clears its wishlist/notify-me rows) and logs the deletion (admin session required).",
    request: z.object({ token: z.string().min(1).max(100), product_id: z.number().int().positive() }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.products).where(eq(schema.products.id, args.product_id)).limit(1);
      const p = rows[0];
      if (!p) return { ok: false, error: "Product nahi mila." };
      await db.batch([
        db.delete(schema.products).where(eq(schema.products.id, p.id)),
        db.delete(schema.wishlist).where(eq(schema.wishlist.productId, p.id)),
        db.delete(schema.notifyMe).where(eq(schema.notifyMe.productId, p.id)),
      ]);
      await logActivity(ctx, "product_delete", `🗑️ Admin ne product DELETE kiya: "${p.name}" (${p.weight}, ₹${p.price}, stock ${p.stock} tha).`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  adminListOrders: defineAction({
    description: "Admin orders list: all orders across all customers with items, totals and live status (admin session required).",
    request: z.object({ token: z.string().min(1).max(100), limit: z.number().int().positive().max(200).default(100) }),
    response: z.object({ ok: z.boolean(), error: z.string(), orders: z.array(orderShape) }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED, orders: [] };
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(args.limit);
      return { ok: true, error: "", orders: rows.map(toOrder) };
    },
  }),

  adminSetOrderStatus: defineAction({
    description: "Admin changes any order's status directly (placed/packing/on the way/delivered/cancelled). Cancelling restores stock and refunds coins exactly like a customer cancel; every change is logged (admin session required).",
    request: z.object({
      token: z.string().min(1).max(100),
      order_id: z.string().min(1).max(40),
      status: z.enum(["placed", "packing", "on_the_way", "delivered", "cancelled"]),
    }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, args.order_id)).limit(1);
      const row = rows[0];
      if (!row) return { ok: false, error: "Order nahi mila." };
      const live = toOrder(row);
      if (args.status === "cancelled") {
        if (row.status === "cancelled") return { ok: false, error: "Ye order pehle se cancelled hai." };
        if (live.status === "delivered") return { ok: false, error: "Delivered order cancel nahi ho sakta." };
        const stmts: BatchItem<"sqlite">[] = [
          db.update(schema.orders).set({ status: "cancelled" }).where(eq(schema.orders.id, row.id)),
        ];
        for (const line of live.items) {
          stmts.push(
            db.update(schema.products)
              .set({ stock: sql`${schema.products.stock} + ${line.qty}` })
              .where(eq(schema.products.id, line.product_id)),
          );
        }
        if (row.coinsRedeemed > 0 || row.coinsEarned > 0) {
          stmts.push(
            db.update(schema.accounts)
              .set({ coins: sql`MAX(0, ${schema.accounts.coins} + ${row.coinsRedeemed} - ${row.coinsEarned})` })
              .where(eq(schema.accounts.id, row.accountId)),
          );
        }
        stmts.push(
          db.insert(schema.notifications).values({
            audience: "customer", type: "order", orderId: row.id,
            title: `❌ Order ${row.id} Admin Ne Cancel Kiya`,
            message: "Store admin ne ye order cancel kar diya — stock aur coins (agar lage the) wapas ho gaye hain.",
            isRead: 0, createdAt: new Date(),
          }),
        );
        const [first, ...rest] = stmts;
        if (first) await db.batch([first, ...rest]);
        await logActivity(ctx, "order_status", `🚫 Admin ne order ${row.id} ka status "${live.status_label}" → "Cancelled" kiya (stock/coins wapas).`);
        ctx.invalidateQueries();
        return { ok: true, error: "" };
      }
      const stepMap: Record<string, number> = { placed: 0, packing: 1, on_the_way: 2, delivered: 3 };
      const step = stepMap[args.status] ?? 0;
      await db.batch([
        db.update(schema.orders).set({ status: args.status, statusStep: step }).where(eq(schema.orders.id, row.id)),
        db.insert(schema.notifications).values({
          audience: "customer", type: "order", orderId: row.id,
          title: `🛵 Order ${row.id} — ${STATUS_LABELS[args.status]}`,
          message: `Admin ne order ka status badla: ${STATUS_LABELS[args.status]}.`,
          isRead: 0, createdAt: new Date(),
        }),
      ]);
      await logActivity(ctx, "order_status", `🔄 Admin ne order ${row.id} ka status "${live.status_label}" → "${STATUS_LABELS[args.status]}" kiya.`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  adminListVendors: defineAction({
    description: "Admin vendors list: registered partner vendors with approval status and how many live catalog products each one sells (admin session required).",
    request: z.object({ token: z.string().min(1).max(100) }),
    response: z.object({
      ok: z.boolean(), error: z.string(),
      vendors: z.array(z.object({
        id: z.number(), shop_name: z.string(), owner_name: z.string(), phone: z.string(),
        area: z.string(), status: z.string(), created_at: z.string(), product_count: z.number(),
      })),
    }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED, vendors: [] };
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.vendors).orderBy(desc(schema.vendors.id));
      const prods = await db.select().from(schema.products);
      return {
        ok: true, error: "",
        vendors: rows.map((v) => ({
          id: v.id, shop_name: v.shopName, owner_name: v.ownerName, phone: v.phone,
          area: v.area, status: v.status, created_at: v.createdAt.toISOString(),
          product_count: prods.filter((p) => p.source === "vendor" && p.vendor === v.shopName).length,
        })),
      };
    },
  }),

  adminSetVendorStatus: defineAction({
    description: "Admin approves a vendor or removes one. Removing a vendor deletes their registration and their live catalog products; both actions are logged (admin session required).",
    request: z.object({
      token: z.string().min(1).max(100),
      vendor_id: z.number().int().positive(),
      status: z.enum(["approved", "removed"]),
    }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.vendors).where(eq(schema.vendors.id, args.vendor_id)).limit(1);
      const v = rows[0];
      if (!v) return { ok: false, error: "Vendor nahi mila." };
      if (args.status === "approved") {
        await db.update(schema.vendors).set({ status: "approved" }).where(eq(schema.vendors.id, v.id));
        await logActivity(ctx, "vendor_status", `✅ Admin ne vendor "${v.shopName}" ko APPROVE kiya.`);
        ctx.invalidateQueries();
        return { ok: true, error: "" };
      }
      const theirProducts = await db.select().from(schema.products)
        .where(sql`${schema.products.source} = 'vendor' AND ${schema.products.vendor} = ${v.shopName}`);
      const stmts: BatchItem<"sqlite">[] = [
        db.delete(schema.vendors).where(eq(schema.vendors.id, v.id)),
      ];
      for (const p of theirProducts) {
        stmts.push(db.delete(schema.products).where(eq(schema.products.id, p.id)));
        stmts.push(db.delete(schema.wishlist).where(eq(schema.wishlist.productId, p.id)));
        stmts.push(db.delete(schema.notifyMe).where(eq(schema.notifyMe.productId, p.id)));
      }
      const [first, ...rest] = stmts;
      if (first) await db.batch([first, ...rest]);
      await logActivity(ctx, "vendor_status", `🗑️ Admin ne vendor "${v.shopName}" ko REMOVE kiya — registration aur unke ${theirProducts.length} catalog products delete ho gaye.`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  adminListCoupons: defineAction({
    description: "Admin coupons list: platform coupons (FATA75/FIRST50) and vendor coupons, each with its live enabled state (admin session required).",
    request: z.object({ token: z.string().min(1).max(100) }),
    response: z.object({
      ok: z.boolean(), error: z.string(),
      platform: z.array(z.object({ code: z.string(), off: z.number(), min_order: z.number(), label: z.string(), enabled: z.boolean() })),
      vendor: z.array(z.object({ id: z.number(), code: z.string(), off: z.number(), min_order: z.number(), vendor_name: z.string(), enabled: z.boolean() })),
    }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED, platform: [], vendor: [] };
      await ensureAdminSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const pc = await db.select().from(schema.platformCoupons);
      const vc = await db.select().from(schema.vendorCoupons).orderBy(desc(schema.vendorCoupons.id));
      return {
        ok: true, error: "",
        platform: pc.map((c) => ({ code: c.code, off: c.off, min_order: c.minOrder, label: c.label, enabled: c.enabled === 1 })),
        vendor: vc.map((c) => ({ id: c.id, code: c.code, off: c.off, min_order: c.minOrder, vendor_name: c.vendorName, enabled: c.enabled === 1 })),
      };
    },
  }),

  adminToggleCoupon: defineAction({
    description: "Admin enables or disables a platform or vendor coupon; checkout stops honouring a disabled coupon immediately. Logged (admin session required).",
    request: z.object({
      token: z.string().min(1).max(100),
      kind: z.enum(["platform", "vendor"]),
      code: z.string().max(20).default(""),
      coupon_id: z.number().int().default(0),
      enabled: z.boolean(),
    }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db<typeof schema>();
      if (args.kind === "platform") {
        const code = args.code.toUpperCase();
        const rows = await db.select().from(schema.platformCoupons).where(eq(schema.platformCoupons.code, code)).limit(1);
        if (!rows[0]) return { ok: false, error: "Platform coupon nahi mila." };
        await db.update(schema.platformCoupons).set({ enabled: args.enabled ? 1 : 0 }).where(eq(schema.platformCoupons.code, code));
        await logActivity(ctx, "coupon_toggle", `🎟️ Admin ne platform coupon ${code} ko ${args.enabled ? "ON (live)" : "OFF (band)"} kiya.`);
      } else {
        const rows = await db.select().from(schema.vendorCoupons).where(eq(schema.vendorCoupons.id, args.coupon_id)).limit(1);
        const c = rows[0];
        if (!c) return { ok: false, error: "Vendor coupon nahi mila." };
        await db.update(schema.vendorCoupons).set({ enabled: args.enabled ? 1 : 0 }).where(eq(schema.vendorCoupons.id, c.id));
        await logActivity(ctx, "coupon_toggle", `🎟️ Admin ne vendor coupon ${c.code} (${c.vendorName}) ko ${args.enabled ? "ON (live)" : "OFF (band)"} kiya.`);
      }
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  adminDeleteCoupon: defineAction({
    description: "Admin permanently deletes a platform or vendor coupon; the code stops working in carts immediately. Logged (admin session required).",
    request: z.object({
      token: z.string().min(1).max(100),
      kind: z.enum(["platform", "vendor"]),
      code: z.string().max(20).default(""),
      coupon_id: z.number().int().default(0),
    }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db<typeof schema>();
      if (args.kind === "platform") {
        const code = args.code.toUpperCase();
        const rows = await db.select().from(schema.platformCoupons).where(eq(schema.platformCoupons.code, code)).limit(1);
        if (!rows[0]) return { ok: false, error: "Platform coupon nahi mila." };
        await db.delete(schema.platformCoupons).where(eq(schema.platformCoupons.code, code));
        await logActivity(ctx, "coupon_delete", `🗑️ Admin ne platform coupon ${code} DELETE kar diya — ab ye code kisi cart me nahi chalega.`);
      } else {
        const rows = await db.select().from(schema.vendorCoupons).where(eq(schema.vendorCoupons.id, args.coupon_id)).limit(1);
        const c = rows[0];
        if (!c) return { ok: false, error: "Vendor coupon nahi mila." };
        await db.delete(schema.vendorCoupons).where(eq(schema.vendorCoupons.id, c.id));
        await logActivity(ctx, "coupon_delete", `🗑️ Admin ne vendor coupon ${c.code} (${c.vendorName}) DELETE kar diya.`);
      }
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  adminCustomers: defineAction({
    description: "Admin customers view: the saved customer profile with coin balance and referral state, per-customer order/spend summaries grouped from real orders, and the latest orders (admin session required).",
    request: z.object({ token: z.string().min(1).max(100) }),
    response: z.object({
      ok: z.boolean(), error: z.string(),
      profile: z.object({ name: z.string(), phone: z.string(), coins: z.number(), referral_code: z.string(), referred_by: z.string() }),
      customers: z.array(z.object({ name: z.string(), phone: z.string(), orders: z.number(), spent: z.number(), last_order_at: z.string() })),
      recent_orders: z.array(orderShape),
    }),
    async handler(ctx, args) {
      const emptyProfile = { name: "", phone: "", coins: 0, referral_code: "", referred_by: "" };
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED, profile: emptyProfile, customers: [], recent_orders: [] };
      await ensureSeeded(ctx);
      await ensureAccounts(ctx);
      const db = ctx.db<typeof schema>();
      const accRows = await db.select().from(schema.accounts).orderBy(asc(schema.accounts.id));
      const guest = accRows[0];
      const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(500);
      const customers = accRows.map((a) => {
        const mine = rows.filter((o) => o.accountId === a.id);
        const last = mine[0];
        return {
          name: a.name, phone: a.phone, orders: mine.length,
          spent: mine.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.grandTotal, 0),
          last_order_at: last ? last.createdAt.toISOString() : a.createdAt.toISOString(),
        };
      });
      return {
        ok: true, error: "",
        profile: {
          name: guest?.name ?? "", phone: guest?.phone ?? "", coins: guest?.coins ?? 0,
          referral_code: guest?.referralCode ?? "", referred_by: guest?.referredBy ?? "",
        },
        customers,
        recent_orders: rows.slice(0, 20).map(toOrder),
      };
    },
  }),

  adminGetSettings: defineAction({
    description: "Admin reads the live store settings: delivery charge, free-delivery threshold and geofence radius in km (admin session required).",
    request: z.object({ token: z.string().min(1).max(100) }),
    response: z.object({ ok: z.boolean(), error: z.string(), delivery_charge: z.number(), free_threshold: z.number(), geofence_km: z.number() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED, delivery_charge: 0, free_threshold: 0, geofence_km: 0 };
      const s = await getSettings(ctx);
      return { ok: true, error: "", delivery_charge: s.deliveryCharge, free_threshold: s.freeThreshold, geofence_km: s.geofenceKm };
    },
  }),

  adminUpdateSettings: defineAction({
    description: "Admin saves store settings (delivery charge ₹, free-delivery threshold ₹, geofence radius km). Checkout pricing and area serviceability use the new values immediately; the change is logged (admin session required).",
    request: z.object({
      token: z.string().min(1).max(100),
      delivery_charge: z.number().int().min(0).max(500),
      free_threshold: z.number().int().min(0).max(10000),
      geofence_km: z.number().min(0.5).max(20),
    }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED };
      const old = await getSettings(ctx);
      const db = ctx.db<typeof schema>();
      const stmts: BatchItem<"sqlite">[] = [
        db.update(schema.appSettings)
          .set({ deliveryCharge: args.delivery_charge, freeThreshold: args.free_threshold, geofenceKm: args.geofence_km })
          .where(eq(schema.appSettings.id, 1)),
      ];
      const areaRows = await db.select().from(schema.areas);
      for (const a of areaRows) {
        stmts.push(
          db.update(schema.areas)
            .set({ serviceable: a.distKm <= args.geofence_km ? 1 : 0 })
            .where(eq(schema.areas.id, a.id)),
        );
      }
      const [first, ...rest] = stmts;
      if (first) await db.batch([first, ...rest]);
      await logActivity(ctx, "settings_change",
        `⚙️ Admin ne settings badli: delivery charge ₹${old.deliveryCharge} → ₹${args.delivery_charge}, free-delivery threshold ₹${old.freeThreshold} → ₹${args.free_threshold}, geofence radius ${old.geofenceKm} km → ${args.geofence_km} km.`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),

  adminChangePin: defineAction({
    description: "Admin changes the admin PIN (current PIN required). The new PIN is stored as a fresh salted hash and ALL admin sessions are killed, forcing a fresh login everywhere. Logged (admin session required).",
    request: z.object({
      token: z.string().min(1).max(100),
      current_pin: z.string().min(4).max(8),
      new_pin: z.string().min(4).max(8),
    }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED };
      if (!/^\d+$/.test(args.new_pin)) return { ok: false, error: "Naya PIN sirf numbers ka rakho (4–8 digit)." };
      if (args.new_pin === args.current_pin) return { ok: false, error: "Naya PIN purane se alag rakho." };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.adminConfig).limit(1);
      const cfg = rows[0];
      if (!cfg) return { ok: false, error: "Admin config nahi mila." };
      const hash = await hashPin(args.current_pin, cfg.salt);
      if (hash !== cfg.pinHash) {
        await logActivity(ctx, "pin_change_failed", "⚠️ PIN badalne ki koshish me galat current PIN daala gaya — PIN change nahi hua.");
        return { ok: false, error: "Current PIN galat hai — PIN change nahi hua." };
      }
      const salt = randomHex(16);
      const pinHash = await hashPin(args.new_pin, salt);
      await db.batch([
        db.update(schema.adminConfig).set({ pinHash, salt, failedAttempts: 0, lockedUntil: 0 }).where(eq(schema.adminConfig.id, cfg.id)),
        db.delete(schema.adminSessions),
      ]);
      await logActivity(ctx, "pin_change", "🔑 Admin PIN badal gaya — suraksha ke liye saare admin sessions khatam kar diye gaye, naye PIN se phir login karna hoga.");
      return { ok: true, error: "" };
    },
  }),

  adminActivityLog: defineAction({
    description: "Admin activity/security log: logins, failed login attempts with timestamps, lockouts, product edits/deletes, order status changes, coupon and settings changes — newest first (admin session required).",
    request: z.object({ token: z.string().min(1).max(100), limit: z.number().int().positive().max(200).default(80) }),
    response: z.object({
      ok: z.boolean(), error: z.string(),
      entries: z.array(z.object({ id: z.number(), kind: z.string(), detail: z.string(), created_at: z.string() })),
    }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED, entries: [] };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.adminActivity).orderBy(desc(schema.adminActivity.id)).limit(args.limit);
      return {
        ok: true, error: "",
        entries: rows.map((r) => ({ id: r.id, kind: r.kind, detail: r.detail, created_at: r.createdAt.toISOString() })),
      };
    },
  }),

  adminBackup: defineAction({
    description: "Admin data backup: exports products, orders, vendors, all coupons and settings as one JSON document the owner can download and keep for recovery (admin session required).",
    request: z.object({ token: z.string().min(1).max(100) }),
    response: z.object({ ok: z.boolean(), error: z.string(), filename: z.string(), json: z.string() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED, filename: "", json: "" };
      await ensureSeeded(ctx);
      const settings = await getSettings(ctx);
      const db = ctx.db<typeof schema>();
      const prods = await db.select().from(schema.products).orderBy(asc(schema.products.sortOrder));
      const orderRows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
      const vendorRows = await db.select().from(schema.vendors);
      const pc = await db.select().from(schema.platformCoupons);
      const vc = await db.select().from(schema.vendorCoupons);
      const accRows = await db.select().from(schema.accounts);
      const ticketRows = await db.select().from(schema.supportTickets);
      const now = new Date();
      const backup = {
        app: "Fatafat Full App",
        exported_at: now.toISOString(),
        settings: {
          delivery_charge: settings.deliveryCharge,
          free_threshold: settings.freeThreshold,
          geofence_km: settings.geofenceKm,
        },
        products: prods,
        orders: orderRows.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
        vendors: vendorRows.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() })),
        platform_coupons: pc,
        vendor_coupons: vc.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
        accounts: accRows.map((a) => ({
          id: a.id, name: a.name, phone: a.phone, coins: a.coins,
          referral_code: a.referralCode, referred_by: a.referredBy,
          current_area_id: a.currentAreaId, has_pin: a.pinHash !== "",
          created_at: a.createdAt.toISOString(),
        })),
        support_tickets: ticketRows.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
      };
      await logActivity(ctx, "backup", `💾 Admin ne data backup download kiya — ${prods.length} products, ${orderRows.length} orders, ${vendorRows.length} vendors, ${pc.length + vc.length} coupons, settings.`);
      const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
      return { ok: true, error: "", filename: `fatafat-backup-${stamp}.json`, json: JSON.stringify(backup, null, 2) };
    },
  }),

  /* ================================================================== */
  /* CUSTOMER ACCOUNTS — sign-up / login / logout. PINs are verified     */
  /* only on the server against salted hashes; login moves the whole     */
  /* app to that customer's account.                                     */
  /* ================================================================== */

  customerSignup: defineAction({
    description: "Customer sign-up: creates an account with name, mobile number and a 4–6 digit login PIN (stored only as a salted hash on the server) and logs the app into the new account. The same mobile number cannot register twice; signing up with the guest/demo number claims that account by setting its PIN.",
    request: z.object({
      name: z.string().trim().min(2).max(60),
      phone: z.string().trim().min(10).max(20),
      pin: z.string().min(4).max(6),
    }),
    response: z.object({ ok: z.boolean(), token: z.string(), name: z.string(), error: z.string() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      await ensureAccounts(ctx);
      const fail = (error: string) => ({ ok: false, token: "", name: "", error });
      if (!/^\d{4,6}$/.test(args.pin)) return fail("Login PIN 4–6 digit ka number rakho (sirf digits).");
      const local = normalizePhone(args.phone);
      if (!local) return fail("Sahi 10-digit mobile number likho (6–9 se shuru). +91 / 0 wala bhi chalega.");
      const existing = await findAccountByPhone(ctx, local);
      const db = ctx.db<typeof schema>();
      const salt = randomHex(16);
      const pinHash = await hashPin(args.pin, salt);
      if (existing) {
        if (existing.pinHash) return fail("Is mobile number se pehle hi account bana hua hai — Login tab se apne PIN ke saath login karo.");
        // Guest/demo account claim: same number, no PIN yet — set the PIN
        // on the existing account so all its orders/coins stay attached.
        await db.update(schema.accounts)
          .set({ pinHash, salt, name: args.name.trim(), failedAttempts: 0, lockedUntil: 0 })
          .where(eq(schema.accounts.id, existing.id));
        const token = await startCustomerSession(ctx, existing.id);
        await db.insert(schema.notifications).values({
          audience: "customer", type: "offer",
          title: `🔐 Welcome back, ${args.name.trim()}!`,
          message: "Tumhara PIN set ho gaya — ab tum is account ke malik ho. Tumhare purane orders, coins aur subscriptions sab isi account me hain.",
          isRead: 0, createdAt: new Date(),
        });
        ctx.invalidateQueries();
        return { ok: true, token, name: args.name.trim(), error: "" };
      }
      const inserted = await db.insert(schema.accounts).values({
        name: args.name.trim(), phone: args.phone.trim(), pinHash, salt,
        referralCode: referralCodeFor(args.name, args.phone), referredBy: "",
        coins: 0, currentAreaId: "sec62", createdAt: new Date(),
      }).returning({ id: schema.accounts.id });
      const newId = inserted[0]?.id ?? 0;
      const token = await startCustomerSession(ctx, newId);
      await db.insert(schema.notifications).values({
        audience: "customer", type: "offer",
        title: `🎉 Welcome to Fatafat, ${args.name.trim()}!`,
        message: "Tumhara account ban gaya hai. Pehle order par 5% coins cashback milega — aur dost ka referral code lagane par 50 coins free!",
        isRead: 0, createdAt: new Date(),
      });
      ctx.invalidateQueries();
      return { ok: true, token, name: args.name.trim(), error: "" };
    },
  }),

  customerLogin: defineAction({
    description: "Customer login with mobile number + PIN, verified on the server against the stored hash. Wrong PINs are counted per account and the account locks for 5 minutes after 5 failures (attempts are also written to the admin activity log). On success the whole app switches to that customer's account.",
    request: z.object({
      phone: z.string().trim().min(10).max(20),
      pin: z.string().min(4).max(6),
    }),
    response: z.object({ ok: z.boolean(), token: z.string(), name: z.string(), error: z.string(), locked_seconds: z.number() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      await ensureAccounts(ctx);
      const fail = (error: string, locked_seconds = 0) => ({ ok: false, token: "", name: "", error, locked_seconds });
      const local = normalizePhone(args.phone);
      if (!local) return fail("Sahi 10-digit mobile number likho.");
      const acc = await findAccountByPhone(ctx, local);
      if (!acc || !acc.pinHash) return fail("Is number par koi PIN account nahi mila — pehle Sign Up karke account banao.");
      const db = ctx.db<typeof schema>();
      const now = Date.now();
      if (acc.lockedUntil > now) {
        const secs = Math.ceil((acc.lockedUntil - now) / 1000);
        return fail(`Ye account LOCKED hai — bahut zyada galat PIN koshishen. ${Math.ceil(secs / 60)} minute baad phir try karo.`, secs);
      }
      const hash = await hashPin(args.pin, acc.salt);
      if (hash !== acc.pinHash) {
        const attempts = acc.failedAttempts + 1;
        if (attempts >= ADMIN_MAX_ATTEMPTS) {
          await db.update(schema.accounts).set({ failedAttempts: 0, lockedUntil: now + ADMIN_LOCK_MS }).where(eq(schema.accounts.id, acc.id));
          await logActivity(ctx, "customer_login_locked", `🚨 Customer account ${acc.phone} par ${ADMIN_MAX_ATTEMPTS} baar galat PIN — account ${ADMIN_LOCK_MS / 60000} minute ke liye lock.`);
          return fail("5 baar galat PIN! Security ke liye ye account 5 minute ke liye lock ho gaya hai.", ADMIN_LOCK_MS / 1000);
        }
        await db.update(schema.accounts).set({ failedAttempts: attempts }).where(eq(schema.accounts.id, acc.id));
        await logActivity(ctx, "customer_login_failed", `❌ Customer account ${acc.phone} par galat PIN ki koshish #${attempts}.`);
        return fail(`Galat PIN — ${ADMIN_MAX_ATTEMPTS - attempts} koshish aur bachi hain, phir account lock ho jayega.`);
      }
      await db.update(schema.accounts).set({ failedAttempts: 0, lockedUntil: 0 }).where(eq(schema.accounts.id, acc.id));
      const token = await startCustomerSession(ctx, acc.id);
      ctx.invalidateQueries();
      return { ok: true, token, name: acc.name, error: "", locked_seconds: 0 };
    },
  }),

  customerLogout: defineAction({
    description: "Customer logout: deletes the server session and switches the app back to the default guest/demo account.",
    request: z.object({ token: z.string().max(100) }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      await ensureAccounts(ctx);
      const db = ctx.db<typeof schema>();
      const st = await db.select().from(schema.appState).limit(1);
      const state = st[0];
      const token = args.token || (state?.currentSessionToken ?? "");
      if (token) {
        await db.delete(schema.customerSessions).where(eq(schema.customerSessions.token, token));
      }
      if (state && (args.token === "" || state.currentSessionToken === token)) {
        await db.update(schema.appState)
          .set({ currentAccountId: 1, currentSessionToken: "" })
          .where(eq(schema.appState.id, 1));
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  customerSessionCheck: defineAction({
    description: "Checks whether a stored customer session token is still the app's active session (used on app start to clear stale tokens).",
    request: z.object({ token: z.string().max(100) }),
    response: z.object({ valid: z.boolean(), name: z.string() }),
    async handler(ctx, args) {
      await ensureAccounts(ctx);
      if (!args.token) return { valid: false, name: "" };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.customerSessions).where(eq(schema.customerSessions.token, args.token)).limit(1);
      const s = rows[0];
      if (!s || s.expiresAt.getTime() <= Date.now()) return { valid: false, name: "" };
      const st = await db.select().from(schema.appState).limit(1);
      if ((st[0]?.currentSessionToken ?? "") !== args.token) return { valid: false, name: "" };
      const acc = await db.select().from(schema.accounts).where(eq(schema.accounts.id, s.accountId)).limit(1);
      return { valid: true, name: acc[0]?.name ?? "" };
    },
  }),

  /* ================================================================== */
  /* HELP & SUPPORT — tickets from the Help page, read by the admin.     */
  /* ================================================================== */

  submitSupportTicket: defineAction({
    description: "Saves a Help-page 'Problem batao' support request (name, mobile, message) to the database; it appears in the admin panel's Support section and alerts store staff.",
    request: z.object({
      name: z.string().trim().min(2).max(60),
      mobile: z.string().trim().min(10).max(20),
      message: z.string().trim().min(5).max(1000),
    }),
    response: z.object({ ok: z.boolean(), id: z.number(), error: z.string() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      if (!normalizePhone(args.mobile)) return { ok: false, id: 0, error: "Sahi 10-digit mobile number likho — team tumhe usi par contact karegi." };
      const db = ctx.db<typeof schema>();
      const now = new Date();
      const inserted = await db.insert(schema.supportTickets).values({
        name: args.name, mobile: args.mobile, message: args.message, status: "open", createdAt: now,
      }).returning({ id: schema.supportTickets.id });
      await db.insert(schema.notifications).values({
        audience: "staff", type: "staff",
        title: `🆘 Naya Support Request — ${args.name}`,
        message: `${args.mobile}: ${args.message.slice(0, 140)}`,
        isRead: 0, createdAt: now,
      });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0, error: "" };
    },
  }),

  adminListTickets: defineAction({
    description: "Admin support inbox: all Help-page problem reports, newest first, with open/resolved status (admin session required).",
    request: z.object({ token: z.string().min(1).max(100), limit: z.number().int().positive().max(200).default(100) }),
    response: z.object({
      ok: z.boolean(), error: z.string(),
      tickets: z.array(z.object({
        id: z.number(), name: z.string(), mobile: z.string(), message: z.string(),
        status: z.string(), created_at: z.string(),
      })),
    }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED, tickets: [] };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.supportTickets).orderBy(desc(schema.supportTickets.id)).limit(args.limit);
      return {
        ok: true, error: "",
        tickets: rows.map((t) => ({
          id: t.id, name: t.name, mobile: t.mobile, message: t.message,
          status: t.status, created_at: t.createdAt.toISOString(),
        })),
      };
    },
  }),

  adminSetTicketStatus: defineAction({
    description: "Admin marks a support request resolved or reopens it; the change is logged (admin session required).",
    request: z.object({
      token: z.string().min(1).max(100),
      ticket_id: z.number().int().positive(),
      status: z.enum(["open", "resolved"]),
    }),
    response: z.object({ ok: z.boolean(), error: z.string() }),
    async handler(ctx, args) {
      if (!(await requireAdmin(ctx, args.token))) return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.supportTickets).where(eq(schema.supportTickets.id, args.ticket_id)).limit(1);
      const t = rows[0];
      if (!t) return { ok: false, error: "Support request nahi mili." };
      await db.update(schema.supportTickets).set({ status: args.status }).where(eq(schema.supportTickets.id, t.id));
      await logActivity(ctx, "support_status", `🆘 Admin ne support request #${t.id} (${t.name}) ko ${args.status === "resolved" ? "RESOLVED ✓" : "phir se OPEN"} kiya.`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    },
  }),
} satisfies ActionsModule;
