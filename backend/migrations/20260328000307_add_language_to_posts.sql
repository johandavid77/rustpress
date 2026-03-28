ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'es';

CREATE INDEX IF NOT EXISTS idx_posts_language ON posts(language);
