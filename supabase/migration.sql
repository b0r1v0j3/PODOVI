-- =============================================
-- Podovi.online — Supabase Schema Migration
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. Categories
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  parent_id UUID REFERENCES categories(id),
  order_num INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- =============================================
-- 2. Brands
-- =============================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  website TEXT,
  country_of_origin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

-- =============================================
-- 3. Products
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  category_id UUID NOT NULL REFERENCES categories(id),
  brand_id UUID NOT NULL REFERENCES brands(id),
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2),
  price_unit TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  coverage_per_package NUMERIC(10, 2),
  external_link TEXT,
  details_sections JSONB,
  documents JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;

-- =============================================
-- 4. Product Images
-- =============================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  order_num INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- =============================================
-- 5. Product Specs
-- =============================================
CREATE TABLE IF NOT EXISTS product_specs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_specs_product_id ON product_specs(product_id);

-- =============================================
-- 6. Colors
-- =============================================
CREATE TABLE IF NOT EXISTS colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_slug TEXT NOT NULL,
  collection_name TEXT NOT NULL DEFAULT '',
  category_slug TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  texture_url TEXT,
  lifestyle_url TEXT,
  image_count INT NOT NULL DEFAULT 0,
  welding_rod TEXT,
  dimension TEXT,
  format TEXT,
  overall_thickness TEXT,
  description TEXT,
  specs JSONB,
  collection_specs JSONB,
  characteristics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_colors_collection_slug ON colors(collection_slug);
CREATE INDEX IF NOT EXISTS idx_colors_category_slug ON colors(category_slug);
CREATE INDEX IF NOT EXISTS idx_colors_slug ON colors(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_colors_collection_slug_code ON colors(collection_slug, code);

-- =============================================
-- 7. Inquiries
-- =============================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT,
  product_name TEXT,
  product_sku TEXT,
  product_url TEXT,
  product_image TEXT,
  product_category TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  quantity_m2 NUMERIC(10, 2),
  message TEXT NOT NULL DEFAULT '',
  preferred_contact TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Public read access for catalog tables
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read product_images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public read product_specs" ON product_specs FOR SELECT USING (true);
CREATE POLICY "Public read colors" ON colors FOR SELECT USING (true);

-- Inquiries: public can insert, only service_role can read
CREATE POLICY "Public insert inquiries" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Service read inquiries" ON inquiries FOR SELECT USING (auth.role() = 'service_role');
