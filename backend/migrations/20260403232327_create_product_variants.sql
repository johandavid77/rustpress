CREATE TABLE IF NOT EXISTS product_variants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,           -- "Talla M / Azul"
    options    JSONB NOT NULL DEFAULT '{}', -- {"talla":"M","color":"Azul"}
    sku        TEXT,
    price      FLOAT8,                  -- NULL = usar precio del producto
    stock      INT NOT NULL DEFAULT 0,
    image      TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
