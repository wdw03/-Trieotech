-- ══════════════════════════════════════════════════════════════
-- TRIO ENTERPRISES - COMPLETE DATABASE SCHEMA
-- Supabase PostgreSQL with RLS
-- ══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. PROFILES (extends auth.users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────
-- 2. ADDRESSES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Rajasthan',
  pincode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON public.addresses(user_id);

-- ─────────────────────────────────────────
-- 3. CATEGORIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image TEXT DEFAULT '',
  banner TEXT DEFAULT '',
  description TEXT DEFAULT '',
  subcategories JSONB DEFAULT '[]'::jsonb,
  product_count INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON public.categories(slug);

-- ─────────────────────────────────────────
-- 4. PRODUCTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id INT REFERENCES public.categories(id),
  category TEXT NOT NULL DEFAULT '',
  subcategory TEXT DEFAULT '',
  brand TEXT DEFAULT 'Trio Ecart',
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  discount INT DEFAULT 0,
  stock INT NOT NULL DEFAULT 100,
  rating NUMERIC(2,1) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  images JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  material TEXT DEFAULT '',
  color TEXT DEFAULT '',
  occasion TEXT DEFAULT '',
  package_quantity TEXT DEFAULT '',
  country_of_origin TEXT DEFAULT 'India',
  badge TEXT DEFAULT '',
  specifications JSONB DEFAULT '{}'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  short_description TEXT DEFAULT '',
  full_description TEXT DEFAULT '',
  description TEXT DEFAULT '',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  is_new BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_wedding_special BOOLEAN DEFAULT false,
  is_festival_special BOOLEAN DEFAULT false,
  is_handmade BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_category_text ON public.products(category);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_best_seller ON public.products(is_best_seller) WHERE is_best_seller = true;

-- ─────────────────────────────────────────
-- 5. ORDERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'confirmed', 'processing', 'packed',
    'shipped', 'out_for_delivery', 'delivered', 'cancelled',
    'refunded', 'payment_failed'
  )),
  subtotal NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'razorpay',
  shipping_address JSONB NOT NULL,
  delivery_method TEXT DEFAULT 'standard',
  estimated_delivery DATE,
  delivered_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- ─────────────────────────────────────────
-- 6. ORDER ITEMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  image TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  quantity INT NOT NULL DEFAULT 1,
  color TEXT DEFAULT '',
  size TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- ─────────────────────────────────────────
-- 7. PAYMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
    'created', 'authorized', 'captured', 'failed', 'refunded'
  )),
  method TEXT DEFAULT '',
  error_code TEXT DEFAULT '',
  error_description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_razorpay_order ON public.payments(razorpay_order_id);

-- ─────────────────────────────────────────
-- 8. SHIPMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shiprocket_order_id TEXT,
  shiprocket_shipment_id TEXT,
  awb_number TEXT,
  courier_name TEXT DEFAULT '',
  courier_id INT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'pickup_scheduled', 'picked_up', 'in_transit',
    'out_for_delivery', 'delivered', 'rto_initiated', 'rto_delivered',
    'cancelled', 'lost'
  )),
  tracking_url TEXT DEFAULT '',
  estimated_delivery DATE,
  delivered_at TIMESTAMPTZ,
  weight NUMERIC(6,2) DEFAULT 0.5,
  dimensions JSONB DEFAULT '{"length": 20, "breadth": 15, "height": 10}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_order ON public.shipments(order_id);
CREATE INDEX idx_shipments_awb ON public.shipments(awb_number);

-- ─────────────────────────────────────────
-- 9. COUPONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  value NUMERIC(10,2) NOT NULL,
  min_spend NUMERIC(10,2) DEFAULT 0,
  max_discount NUMERIC(10,2),
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON public.coupons(code);

-- ─────────────────────────────────────────
-- 10. REVIEWS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  user_avatar TEXT DEFAULT '',
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  helpful_count INT NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  location TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);

-- ─────────────────────────────────────────
-- 11. WISHLIST
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user ON public.wishlist(user_id);

-- ─────────────────────────────────────────
-- 12. CART ITEMS (server-synced)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  color TEXT DEFAULT '',
  size TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, color, size)
);

CREATE INDEX idx_cart_items_user ON public.cart_items(user_id);

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read/update own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ADDRESSES: Users can CRUD own addresses
CREATE POLICY "Users can view own addresses" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- CATEGORIES: Public read
CREATE POLICY "Categories are publicly readable" ON public.categories
  FOR SELECT USING (true);

-- PRODUCTS: Public read
CREATE POLICY "Products are publicly readable" ON public.products
  FOR SELECT USING (true);

-- ORDERS: Users can view own orders (creation via service role only)
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- ORDER ITEMS: Users can view items of their orders
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- PAYMENTS: Users can view own payment records
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- SHIPMENTS: Users can view own shipment records
CREATE POLICY "Users can view own shipments" ON public.shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = shipments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- COUPONS: Public read for active coupons
CREATE POLICY "Active coupons are publicly readable" ON public.coupons
  FOR SELECT USING (is_active = true);

-- REVIEWS: Public read, authenticated users can insert
CREATE POLICY "Reviews are publicly readable" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WISHLIST: Users can CRUD own wishlist
CREATE POLICY "Users can view own wishlist" ON public.wishlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own wishlist" ON public.wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from own wishlist" ON public.wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- CART: Users can CRUD own cart
CREATE POLICY "Users can view own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own cart" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from own cart" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ══════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_shipments_updated_at BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Generate unique order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TRIO-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════
-- SEED DATA: COUPONS
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.coupons (code, description, discount_type, value, min_spend, is_active) VALUES
  ('TRIO10', '10% off on all ethnic crafts', 'percentage', 10, 0, true),
  ('FESTIVE20', '20% festive special discount', 'percentage', 20, 0, true),
  ('FIRSTBUY', '15% off on your first order', 'percentage', 15, 0, true),
  ('CRAFT100', 'Flat ₹100 off on orders above ₹999', 'flat', 100, 999, true)
ON CONFLICT (code) DO NOTHING;
