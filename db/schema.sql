-- Additive schema migration: safe to run against any database, including
-- production, any number of times. Creates what's missing, never drops or
-- alters existing data. For a destructive full reset (local/dev only), see
-- db/reset.mjs (npm run db:reset), which is separately guarded.

-- Needed for the EXCLUDE constraint below (range/equality index on rental).
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profile fields (added after the initial launch) — additive columns only.
ALTER TABLE account ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE account ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE TABLE IF NOT EXISTS spot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  addr TEXT,
  zipcode TEXT,
  locality TEXT,
  region TEXT,
  country TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  price_rate NUMERIC NOT NULL,
  price_unit TEXT NOT NULL DEFAULT 'hour' CHECK (price_unit IN ('hour', 'day')),
  -- Stored as UTC instants (TIMESTAMPTZ). Every write path converts a
  -- browser-local datetime-local value to an explicit UTC ISO string
  -- client-side before it reaches the server — see lib/time.ts.
  available_start TIMESTAMPTZ,
  available_end TIMESTAMPTZ,
  owner_id UUID,
  FOREIGN KEY (owner_id) REFERENCES account(id) ON DELETE CASCADE
);

-- Protects seeded demo listings from being edited/deleted by the public demo
-- login — checked in app/spots/actions.ts.
ALTER TABLE spot ADD COLUMN IF NOT EXISTS is_protected BOOLEAN NOT NULL DEFAULT FALSE;

-- One photo per spot, stored in Vercel Blob; this column holds its public URL.
ALTER TABLE spot ADD COLUMN IF NOT EXISTS photo_url TEXT;

CREATE TABLE IF NOT EXISTS rental (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES spot(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_ts > start_ts),
  -- Belt-and-suspenders: the API route also rejects overlaps explicitly, but
  -- this closes the race between two concurrent bookings for the same window.
  EXCLUDE USING gist (spot_id WITH =, tstzrange(start_ts, end_ts) WITH &&)
);
