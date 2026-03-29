CREATE TABLE IF NOT EXISTS webhooks (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    url        TEXT NOT NULL,
    event      TEXT NOT NULL DEFAULT 'post.published',
    active     BOOLEAN NOT NULL DEFAULT true,
    secret     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
