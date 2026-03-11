-- migrations/001_users.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles por defecto
INSERT INTO roles (name, permissions) VALUES
    ('admin',  '["posts:read","posts:write","posts:delete","media:upload","media:delete","users:read","users:write","plugins:manage"]'),
    ('editor', '["posts:read","posts:write","media:upload","media:delete"]'),
    ('author', '["posts:read","posts:write","media:upload"]'),
    ('viewer', '["posts:read"]')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username   VARCHAR(50) UNIQUE NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role_id    UUID REFERENCES roles(id) ON DELETE SET NULL,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- migrations/002_posts.sql

CREATE TABLE IF NOT EXISTS posts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        VARCHAR(500) NOT NULL,
    slug         VARCHAR(500) UNIQUE NOT NULL,
    content      TEXT,
    excerpt      TEXT,
    post_type    VARCHAR(50) NOT NULL DEFAULT 'post',
    status       VARCHAR(20) NOT NULL DEFAULT 'draft',
    author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meta         JSONB NOT NULL DEFAULT '{}',
    published_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_slug      ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status    ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author    ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_type      ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at) WHERE status = 'published';

-- Revisiones de posts (historial)
CREATE TABLE IF NOT EXISTS post_revisions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    title      VARCHAR(500),
    content    TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migrations/003_media.sql

CREATE TABLE IF NOT EXISTS media (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename      VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type     VARCHAR(100) NOT NULL,
    size_bytes    BIGINT NOT NULL,
    url           TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text      VARCHAR(500),
    uploaded_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_mime        ON media(mime_type);

-- migrations/004_plugins.sql

CREATE TABLE IF NOT EXISTS plugins (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(100) UNIQUE NOT NULL,
    version      VARCHAR(20) NOT NULL,
    description  TEXT,
    is_enabled   BOOLEAN NOT NULL DEFAULT false,
    config       JSONB NOT NULL DEFAULT '{}',
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
