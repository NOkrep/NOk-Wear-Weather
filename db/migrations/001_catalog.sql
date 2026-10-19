CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE catalog.garment_types (
  id text PRIMARY KEY,
  group_name text NOT NULL CHECK (group_name IN ('base','mid','outer','bottom','one_piece','footwear','accessory')),
  label_tr text NOT NULL,
  label_en text NOT NULL,
  slots jsonb NOT NULL CHECK (jsonb_typeof(slots) = 'array'),
  aliases jsonb NOT NULL CHECK (jsonb_typeof(aliases) = 'array'),
  target_min integer NOT NULL DEFAULT 10 CHECK (target_min > 0),
  target_max integer NOT NULL DEFAULT 15 CHECK (target_max >= target_min)
);

-- These are historical recommendation profiles, never verified store products.
CREATE TABLE catalog.legacy_profiles (
  id text PRIMARY KEY,
  garment_type_id text REFERENCES catalog.garment_types(id),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  verification text NOT NULL DEFAULT 'legacy_unverified' CHECK (verification = 'legacy_unverified')
);

CREATE TABLE catalog.import_batches (
  id uuid PRIMARY KEY,
  digest text NOT NULL UNIQUE,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','published','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CHECK ((state = 'draft' AND reviewed_at IS NULL) OR (state <> 'draft' AND reviewed_at IS NOT NULL))
);

CREATE TABLE catalog.sources (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('manufacturer','retailer','label','laboratory')),
  title text NOT NULL,
  url text NOT NULL CHECK (url LIKE 'https://%'),
  accessed_at timestamptz NOT NULL
);

CREATE TABLE catalog.products (
  id text PRIMARY KEY,
  garment_type_id text NOT NULL REFERENCES catalog.garment_types(id),
  import_batch_id uuid NOT NULL REFERENCES catalog.import_batches(id),
  brand text NOT NULL,
  model text NOT NULL,
  identity_key text NOT NULL UNIQUE,
  name_tr text NOT NULL,
  name_en text NOT NULL,
  product_url text NOT NULL CHECK (product_url LIKE 'https://%'),
  technical boolean,
  gsm numeric CHECK (gsm > 0 AND gsm <= 5000),
  warmth smallint CHECK (warmth BETWEEN 1 AND 5),
  water_resistance text CHECK (water_resistance IN ('none','repellent','waterproof')),
  wind_resistance text CHECK (wind_resistance IN ('low','medium','high')),
  breathability text CHECK (breathability IN ('low','medium','high')),
  search_text text NOT NULL,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', search_text)) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_search_idx ON catalog.products USING gin(search_vector);
CREATE INDEX products_type_idx ON catalog.products(garment_type_id);

CREATE TABLE catalog.materials (
  product_id text NOT NULL REFERENCES catalog.products(id),
  part text NOT NULL CHECK (part IN ('shell','lining','fill')),
  fiber text NOT NULL,
  percent numeric NOT NULL CHECK (percent > 0 AND percent <= 100),
  PRIMARY KEY(product_id, part, fiber)
);

CREATE TABLE catalog.field_evidence (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id text NOT NULL REFERENCES catalog.products(id),
  field text NOT NULL CHECK (field IN ('name','technical','composition','gsm','warmth','waterResistance','windResistance','breathability')),
  source_id text NOT NULL REFERENCES catalog.sources(id),
  basis text NOT NULL CHECK (basis IN ('manufacturer','label','measurement','estimate')),
  note text,
  CHECK (basis <> 'estimate' OR (field = 'warmth' AND note IS NOT NULL AND length(trim(note)) > 0))
);

CREATE FUNCTION catalog.valid_gtin(code text) RETURNS boolean
LANGUAGE sql IMMUTABLE STRICT AS $$
  SELECT code ~ '^[0-9]{14}$' AND
    (SELECT sum(substring(code FROM i FOR 1)::integer * CASE WHEN i % 2 = 1 THEN 3 ELSE 1 END)
     FROM generate_series(1,14) AS i) % 10 = 0
$$;

CREATE TABLE catalog.variants (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES catalog.products(id),
  gtin text UNIQUE CHECK (catalog.valid_gtin(gtin)),
  size text,
  color text,
  sku text
);
CREATE INDEX variants_product_idx ON catalog.variants(product_id);

-- Append-only observations: prices are dated, not an everlasting current-price claim.
CREATE TABLE catalog.offers (
  id text PRIMARY KEY,
  variant_id text NOT NULL REFERENCES catalog.variants(id),
  source_id text NOT NULL REFERENCES catalog.sources(id),
  country char(2) NOT NULL CHECK (country ~ '^[A-Z]{2}$'),
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  price numeric(14,4) NOT NULL CHECK (price BETWEEN 0 AND 100000000),
  checked_at timestamptz NOT NULL,
  availability text NOT NULL CHECK (availability IN ('in_stock','out_of_stock','unknown'))
);
CREATE INDEX offers_variant_country_idx ON catalog.offers(variant_id, country, checked_at DESC);
