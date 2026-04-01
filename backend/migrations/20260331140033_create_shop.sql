-- Categorías de productos
CREATE TABLE IF NOT EXISTS product_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    image       TEXT,
    parent_id   UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Productos
CREATE TABLE IF NOT EXISTS products (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    slug         TEXT NOT NULL UNIQUE,
    description  TEXT,
    price        NUMERIC(10,2) NOT NULL DEFAULT 0,
    compare_price NUMERIC(10,2),
    cost_price   NUMERIC(10,2),
    sku          TEXT UNIQUE,
    stock        INT NOT NULL DEFAULT 0,
    track_stock  BOOLEAN NOT NULL DEFAULT true,
    status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
    category_id  UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    images       TEXT[] NOT NULL DEFAULT '{}',
    tags         TEXT[] NOT NULL DEFAULT '{}',
    weight       NUMERIC(8,2),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Variantes (talla, color, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    sku        TEXT UNIQUE,
    price      NUMERIC(10,2),
    stock      INT NOT NULL DEFAULT 0,
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug       ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status     ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_product    ON product_variants(product_id);
