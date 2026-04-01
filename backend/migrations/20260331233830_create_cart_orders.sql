-- Carrito
CREATE TABLE IF NOT EXISTS carts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price      FLOAT8 NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, product_id, variant_id)
);

-- Órdenes
CREATE TABLE IF NOT EXISTS orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
    total           FLOAT8 NOT NULL DEFAULT 0,
    subtotal        FLOAT8 NOT NULL DEFAULT 0,
    discount        FLOAT8 NOT NULL DEFAULT 0,
    shipping        FLOAT8 NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'COP',
    payment_method  TEXT,
    payment_ref     TEXT,
    notes           TEXT,
    shipping_addr   JSONB,
    meta            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    name       TEXT NOT NULL,
    sku        TEXT,
    quantity   INT NOT NULL DEFAULT 1,
    price      FLOAT8 NOT NULL,
    total      FLOAT8 NOT NULL
);

-- Cupones
CREATE TABLE IF NOT EXISTS coupons (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         TEXT NOT NULL UNIQUE,
    type         TEXT NOT NULL DEFAULT 'percent' CHECK (type IN ('percent','fixed')),
    value        FLOAT8 NOT NULL,
    min_order    FLOAT8,
    max_uses     INT,
    uses         INT NOT NULL DEFAULT 0,
    expires_at   TIMESTAMPTZ,
    active       BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart   ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user       ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
