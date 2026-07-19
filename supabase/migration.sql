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
  next_contact_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS next_contact_date DATE;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_next_contact_date ON inquiries(next_contact_date);

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

-- =============================================
-- 8. Ops Console (Phase 1 contract slice)
-- =============================================
CREATE TABLE IF NOT EXISTS ops_change_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_slug TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published')),
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  rationale TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_change_sets_collection_slug ON ops_change_sets(collection_slug);
CREATE INDEX IF NOT EXISTS idx_ops_change_sets_status ON ops_change_sets(status);
CREATE INDEX IF NOT EXISTS idx_ops_change_sets_created_at ON ops_change_sets(created_at DESC);

CREATE TABLE IF NOT EXISTS ops_change_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_set_id UUID NOT NULL REFERENCES ops_change_sets(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('collection_metadata', 'document')),
  target_key TEXT NOT NULL,
  before_payload JSONB,
  after_payload JSONB NOT NULL,
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(change_set_id, item_type, target_key)
);

CREATE INDEX IF NOT EXISTS idx_ops_change_items_change_set_id ON ops_change_items(change_set_id);
CREATE INDEX IF NOT EXISTS idx_ops_change_items_item_type ON ops_change_items(item_type);

CREATE TABLE IF NOT EXISTS ops_review_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_set_id UUID NOT NULL REFERENCES ops_change_sets(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  reviewer_id TEXT NOT NULL,
  review_comment TEXT NOT NULL DEFAULT '',
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_review_decisions_change_set_id ON ops_review_decisions(change_set_id);
CREATE INDEX IF NOT EXISTS idx_ops_review_decisions_created_at ON ops_review_decisions(created_at DESC);

CREATE TABLE IF NOT EXISTS ops_publish_audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_set_id UUID NOT NULL REFERENCES ops_change_sets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'change_set.created',
      'change_set.updated',
      'change_set.submitted',
      'publish_requested',
      'publish_applied',
      'publish_failed',
      'rollback_requested',
      'rollback_applied',
      'rollback_failed',
      'validation_failed'
    )
  ),
  actor_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload_hash TEXT NOT NULL,
  correlation_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_publish_audit_events_change_set_id ON ops_publish_audit_events(change_set_id);
CREATE INDEX IF NOT EXISTS idx_ops_publish_audit_events_event_type ON ops_publish_audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ops_publish_audit_events_occurred_at ON ops_publish_audit_events(occurred_at DESC);

ALTER TABLE ops_change_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_change_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_review_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_publish_audit_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ops_change_sets'
      AND policyname = 'Service manage ops_change_sets'
  ) THEN
    CREATE POLICY "Service manage ops_change_sets"
      ON ops_change_sets
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ops_change_items'
      AND policyname = 'Service manage ops_change_items'
  ) THEN
    CREATE POLICY "Service manage ops_change_items"
      ON ops_change_items
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ops_review_decisions'
      AND policyname = 'Service manage ops_review_decisions'
  ) THEN
    CREATE POLICY "Service manage ops_review_decisions"
      ON ops_review_decisions
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ops_publish_audit_events'
      AND policyname = 'Service manage ops_publish_audit_events'
  ) THEN
    CREATE POLICY "Service manage ops_publish_audit_events"
      ON ops_publish_audit_events
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

-- =============================================
-- 9. Ops Console (Phase 1 full domain extension)
-- =============================================

CREATE TABLE IF NOT EXISTS ops_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_slug TEXT NOT NULL UNIQUE,
  collection_name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'published', 'archived')),
  source_type TEXT NOT NULL DEFAULT 'resolver',
  source_ref TEXT,
  source_fetched_at TIMESTAMPTZ,
  published_version INTEGER NOT NULL DEFAULT 0,
  draft_version INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_collections_brand_category ON ops_collections(brand_id, category_id);
CREATE INDEX IF NOT EXISTS idx_ops_collections_state ON ops_collections(state);

CREATE TABLE IF NOT EXISTS ops_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_slug TEXT NOT NULL REFERENCES ops_collections(collection_slug) ON DELETE CASCADE,
  variant_slug TEXT NOT NULL,
  variant_code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_slug, variant_slug)
);

CREATE INDEX IF NOT EXISTS idx_ops_variants_collection_slug ON ops_variants(collection_slug);
CREATE INDEX IF NOT EXISTS idx_ops_variants_variant_code ON ops_variants(variant_code);

CREATE TABLE IF NOT EXISTS ops_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_slug TEXT NOT NULL REFERENCES ops_collections(collection_slug) ON DELETE CASCADE,
  variant_slug TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT 'collection' CHECK (scope IN ('collection', 'variant')),
  document_key TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT,
  locale TEXT NOT NULL DEFAULT 'sr-RS',
  url TEXT NOT NULL,
  checksum TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_slug, variant_slug, document_key)
);

CREATE INDEX IF NOT EXISTS idx_ops_documents_collection_slug ON ops_documents(collection_slug);
CREATE INDEX IF NOT EXISTS idx_ops_documents_scope ON ops_documents(scope);

ALTER TABLE ops_change_items DROP CONSTRAINT IF EXISTS ops_change_items_item_type_check;
ALTER TABLE ops_change_items
  ADD CONSTRAINT ops_change_items_item_type_check
  CHECK (item_type IN ('collection_metadata', 'variant_metadata', 'document', 'curation_rule'));

CREATE TABLE IF NOT EXISTS ops_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'applied', 'failed', 'rolled_back')),
  kind TEXT NOT NULL DEFAULT 'publish' CHECK (kind IN ('publish', 'rollback')),
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  rolled_back_from_release_id UUID REFERENCES ops_releases(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT '',
  incident_reference TEXT,
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_releases_status ON ops_releases(status);
CREATE INDEX IF NOT EXISTS idx_ops_releases_kind ON ops_releases(kind);
CREATE INDEX IF NOT EXISTS idx_ops_releases_created_at ON ops_releases(created_at DESC);

CREATE TABLE IF NOT EXISTS ops_release_change_sets (
  release_id UUID NOT NULL REFERENCES ops_releases(id) ON DELETE CASCADE,
  change_set_id UUID NOT NULL REFERENCES ops_change_sets(id) ON DELETE RESTRICT,
  PRIMARY KEY (release_id, change_set_id)
);

CREATE INDEX IF NOT EXISTS idx_ops_release_change_sets_change_set_id ON ops_release_change_sets(change_set_id);

CREATE TABLE IF NOT EXISTS ops_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  release_id UUID NOT NULL UNIQUE REFERENCES ops_releases(id) ON DELETE CASCADE,
  snapshot_hash TEXT NOT NULL,
  snapshot_payload JSONB NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_snapshots_created_at ON ops_snapshots(created_at DESC);

CREATE TABLE IF NOT EXISTS ops_audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('agent', 'user', 'system')),
  actor_id TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload_hash TEXT NOT NULL,
  correlation_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_audit_events_entity ON ops_audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ops_audit_events_action ON ops_audit_events(action);
CREATE INDEX IF NOT EXISTS idx_ops_audit_events_occurred_at ON ops_audit_events(occurred_at DESC);

CREATE TABLE IF NOT EXISTS ops_role_bindings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('agent', 'user')),
  actor_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor', 'reviewer', 'publisher')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(actor_type, actor_id, role)
);

CREATE INDEX IF NOT EXISTS idx_ops_role_bindings_actor ON ops_role_bindings(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_ops_role_bindings_role ON ops_role_bindings(role);

CREATE OR REPLACE FUNCTION prevent_ops_audit_events_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'ops_audit_events is append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_ops_audit_events_append_only ON ops_audit_events;
CREATE TRIGGER trg_ops_audit_events_append_only
BEFORE UPDATE OR DELETE ON ops_audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_ops_audit_events_mutation();

ALTER TABLE ops_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_release_change_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_role_bindings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_collections' AND policyname = 'Service manage ops_collections'
  ) THEN
    CREATE POLICY "Service manage ops_collections"
      ON ops_collections
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_variants' AND policyname = 'Service manage ops_variants'
  ) THEN
    CREATE POLICY "Service manage ops_variants"
      ON ops_variants
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_documents' AND policyname = 'Service manage ops_documents'
  ) THEN
    CREATE POLICY "Service manage ops_documents"
      ON ops_documents
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_releases' AND policyname = 'Service manage ops_releases'
  ) THEN
    CREATE POLICY "Service manage ops_releases"
      ON ops_releases
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_release_change_sets' AND policyname = 'Service manage ops_release_change_sets'
  ) THEN
    CREATE POLICY "Service manage ops_release_change_sets"
      ON ops_release_change_sets
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_snapshots' AND policyname = 'Service manage ops_snapshots'
  ) THEN
    CREATE POLICY "Service manage ops_snapshots"
      ON ops_snapshots
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_audit_events' AND policyname = 'Service insert/read ops_audit_events'
  ) THEN
    CREATE POLICY "Service insert/read ops_audit_events"
      ON ops_audit_events
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_role_bindings' AND policyname = 'Service manage ops_role_bindings'
  ) THEN
    CREATE POLICY "Service manage ops_role_bindings"
      ON ops_role_bindings
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;
