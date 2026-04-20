-- Tabla de tenants (sitios/organizaciones)
CREATE TABLE IF NOT EXISTS tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    domain      VARCHAR(255),
    plan        VARCHAR(50) NOT NULL DEFAULT 'free',
    is_active   BOOLEAN NOT NULL DEFAULT true,
    settings    JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant por defecto para datos existentes
INSERT INTO tenants (id, name, slug, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default', 'default', 'pro')
ON CONFLICT (slug) DO NOTHING;

-- Agregar tenant_id a tablas clave
ALTER TABLE posts     ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE media     ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE plugins   ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE settings  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE users     ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE comments  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_posts_tenant    ON posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_tenant    ON media(tenant_id);
CREATE INDEX IF NOT EXISTS idx_plugins_tenant  ON plugins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settings_tenant ON settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant    ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comments_tenant ON comments(tenant_id);

-- Tabla de tenant_users (admins de cada tenant)
CREATE TABLE IF NOT EXISTS tenant_users (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    role      VARCHAR(50) NOT NULL DEFAULT 'admin',
    PRIMARY KEY (tenant_id, user_id)
);

-- Agregar usuario existente al tenant por defecto
INSERT INTO tenant_users (tenant_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', id, 'owner'
FROM users
WHERE role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1)
ON CONFLICT DO NOTHING;
