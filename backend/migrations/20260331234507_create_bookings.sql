-- Módulo de reservas (tours, hospedaje, restaurante, etc.)
CREATE TABLE IF NOT EXISTS booking_services (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type         TEXT NOT NULL CHECK (type IN ('tour','lodging','restaurant','event','custom')),
    name         TEXT NOT NULL,
    slug         TEXT NOT NULL UNIQUE,
    description  TEXT,
    price        FLOAT8 NOT NULL DEFAULT 0,
    currency     TEXT NOT NULL DEFAULT 'COP',
    capacity     INT,
    duration_min INT,
    images       TEXT[] NOT NULL DEFAULT '{}',
    location     TEXT,
    meta         JSONB NOT NULL DEFAULT '{}',
    active       BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_slots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id  UUID NOT NULL REFERENCES booking_services(id) ON DELETE CASCADE,
    starts_at   TIMESTAMPTZ NOT NULL,
    ends_at     TIMESTAMPTZ NOT NULL,
    capacity    INT NOT NULL DEFAULT 1,
    booked      INT NOT NULL DEFAULT 0,
    price       FLOAT8,
    active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS bookings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id  UUID NOT NULL REFERENCES booking_services(id),
    slot_id     UUID REFERENCES booking_slots(id),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_name  TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    quantity    INT NOT NULL DEFAULT 1,
    total       FLOAT8 NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
    notes       TEXT,
    meta        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_slots_service  ON booking_slots(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_starts   ON booking_slots(starts_at);
CREATE INDEX IF NOT EXISTS idx_bookings_service       ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user          ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings(status);
