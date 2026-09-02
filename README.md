# 🛍️ Trio Ecart — Ethnic Craft E-Commerce Platform

A production-grade, culturally-rich Indian handicraft e-commerce frontend built for **Trio Ecart**. Celebrating traditional Indian karigari, handcrafted Zardosi embroidery appliques, pure copper drinkware, and sacred pooja essentials.

---

## 🎨 Aesthetic & Design System

- **Color Palette:** Deep Maroon (`#8B1A1A`), Antique Gold (`#C5A028`), Ivory/Cream (`#FAF7F2`), Emerald Green (`#065F46`).
- **Typography:** `Playfair Display` + `Cinzel` royal serif paired with `Plus Jakarta Sans`.
- **Features:** Dark/Light mode toggle, micro-animations, glassmorphic headers, mobile bottom navigation bar.

---

## 🧭 Key Features & Included Pages

1. **Home (`/`)**: Hero carousel, Category grid, Best Sellers, New Arrivals, Festival & Wedding Special banners, Brand story, Testimonials, Blog preview, Trust badges bar.
2. **Shop Catalog (`/shop`)**: Complete 43+ artisan product collection with dual filter sidebar (Price slider, Category checkboxes, Badges, In-stock only, Rating) and sort controls.
3. **Category Pages (`/category/:slug`)**: Banner, subcategory tabs, and filterable product grids.
4. **Product Detail (`/product/:slug`)**: Multi-thumbnail zoom gallery, color variant swatches (updates price & image), size selector, quantity stepper, pincode delivery checker, 4 tabs (Description, Specifications, Features, Reviews with interactive form), related crafts, and recently viewed.
5. **Search (`/search?q=`)**: Debounced instant search with trending and recent searches.
6. **Cart (`/cart`) & Slide-in Cart Drawer**: Real-time price breakdown, free shipping progress indicator (threshold: ₹999), and coupon promo code engine (`FESTIVE20`, `TRIO10`, `FIRSTBUY`, `CRAFT100`).
7. **4-Step Checkout (`/checkout`)**: Multi-step flow (Address Selection / New Address ➔ Courier Speed ➔ Payment: UPI, Cards, COD, NetBanking ➔ Review & Place Order).
8. **Order Confirmation (`/order-success/:orderId`)**: Confetti celebration animation, Order ID, courier tracking number, and summary receipt.
9. **Order Tracking (`/track-order`)**: 6-step visual courier journey stepper with live status tags.
10. **Wishlist (`/wishlist`)**: Saved crafts grid with move-to-cart.
11. **Patron Account (`/profile` & `/profile/orders`)**: Address book management and past orders history.
12. **Craft Journal (`/blog` & `/blog/:slug`)**: Heritage articles and styling guides.
13. **SEO & Metadata**: Integrated with `react-helmet-async` for OpenGraph, meta tags, and Product JSON-LD structured data.

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/wdw03/-Trieotech.git
cd -Trieotech
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

---

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite 6
- **Routing:** React Router v6
- **Styling:** Tailwind CSS v3 + Custom Design Tokens
- **Icons:** Lucide React
- **SEO:** `react-helmet-async` (JSON-LD Structured Data)
- **Effects:** Canvas Confetti

---

© 2026 Trio Ecart. Handcrafted with devotion in India.
