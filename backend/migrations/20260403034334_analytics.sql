-- Tabla de eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event      TEXT NOT NULL,           -- 'page_view', 'product_view', 'add_to_cart', 'purchase', 'post_view'
    entity_id  UUID,                    -- id del post/producto/orden
    user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    path       TEXT,
    referrer   TEXT,
    country    TEXT,
    device     TEXT,                    -- 'desktop', 'mobile', 'tablet'
    value      FLOAT8 DEFAULT 0,        -- para purchase: monto
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ae_event      ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_ae_entity     ON analytics_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_ae_created    ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_session    ON analytics_events(session_id);

-- Vista: métricas diarias
CREATE OR REPLACE VIEW analytics_daily AS
SELECT
    DATE_TRUNC('day', created_at) as day,
    COUNT(*) FILTER (WHERE event = 'page_view')    as page_views,
    COUNT(*) FILTER (WHERE event = 'post_view')    as post_views,
    COUNT(*) FILTER (WHERE event = 'product_view') as product_views,
    COUNT(*) FILTER (WHERE event = 'add_to_cart')  as add_to_carts,
    COUNT(*) FILTER (WHERE event = 'purchase')     as purchases,
    COALESCE(SUM(value) FILTER (WHERE event = 'purchase'), 0) as revenue,
    COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;
