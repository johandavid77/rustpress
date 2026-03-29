ALTER TABLE posts ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_posts_publish_at ON posts(publish_at) WHERE status = 'draft';
