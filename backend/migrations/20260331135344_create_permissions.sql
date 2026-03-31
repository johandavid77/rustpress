-- Agregar description a roles si no existe
ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource    TEXT NOT NULL,
    action      TEXT NOT NULL,
    description TEXT,
    UNIQUE(resource, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Roles por defecto
INSERT INTO roles (name, description) VALUES
    ('admin',  'Acceso total al sistema'),
    ('editor', 'Puede crear y editar posts propios'),
    ('author', 'Puede crear posts, no puede publicar'),
    ('viewer', 'Solo lectura')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Permisos por defecto
INSERT INTO permissions (resource, action) VALUES
    ('posts',    'read'),   ('posts',    'create'),
    ('posts',    'update'), ('posts',    'delete'),
    ('posts',    'publish'),('media',    'read'),
    ('media',    'upload'), ('media',    'delete'),
    ('users',    'read'),   ('users',    'create'),
    ('users',    'update'), ('users',    'delete'),
    ('settings', 'read'),   ('settings', 'update'),
    ('webhooks', 'manage'), ('api_keys', 'manage')
ON CONFLICT (resource, action) DO NOTHING;
