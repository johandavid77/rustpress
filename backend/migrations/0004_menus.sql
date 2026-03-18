CREATE TABLE menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    target VARCHAR(20) NOT NULL DEFAULT '_self',
    icon VARCHAR(100),
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menus_slug ON menus(slug);
CREATE INDEX idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX idx_menu_items_parent_id ON menu_items(parent_id);
CREATE INDEX idx_menu_items_order ON menu_items(menu_id, order_index);

-- Seed: menú principal
INSERT INTO menus (id, name, slug, description) VALUES
    ('a1b2c3d4-0000-0000-0000-000000000001', 'Menú Principal', 'main', 'Navegación principal del sitio');

INSERT INTO menu_items (menu_id, label, url, order_index) VALUES
    ('a1b2c3d4-0000-0000-0000-000000000001', 'Inicio', '/', 0),
    ('a1b2c3d4-0000-0000-0000-000000000001', 'Blog', '/blog', 1),
    ('a1b2c3d4-0000-0000-0000-000000000001', 'Acerca de', '/about', 2),
    ('a1b2c3d4-0000-0000-0000-000000000001', 'Contacto', '/contact', 3);
