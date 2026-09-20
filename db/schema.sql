DROP TABLE IF EXISTS rental;
DROP TABLE IF EXISTS spot;
DROP TABLE IF EXISTS account;

-- Needed for the EXCLUDE constraint below (range/equality index on rental).
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE spot (
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
  available_start TIMESTAMPTZ,
  available_end TIMESTAMPTZ,
  owner_id UUID,
  FOREIGN KEY (owner_id) REFERENCES account(id) ON DELETE CASCADE
);

CREATE TABLE rental (
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
