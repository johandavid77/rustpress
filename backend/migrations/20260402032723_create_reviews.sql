CREATE TABLE IF NOT EXISTS reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_name  TEXT,
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title       TEXT,
    body        TEXT,
    verified    BOOLEAN NOT NULL DEFAULT false,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    helpful     INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user    ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status  ON reviews(status);

-- Vista de rating promedio por producto
CREATE OR REPLACE VIEW product_ratings AS
SELECT
    product_id,
    ROUND(AVG(rating)::numeric, 1) as avg_rating,
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE rating = 5) as five_star,
    COUNT(*) FILTER (WHERE rating = 4) as four_star,
    COUNT(*) FILTER (WHERE rating = 3) as three_star,
    COUNT(*) FILTER (WHERE rating = 2) as two_star,
    COUNT(*) FILTER (WHERE rating = 1) as one_star
FROM reviews
WHERE status = 'approved'
GROUP BY product_id;
