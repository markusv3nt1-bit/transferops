-- Locations table for From/To pickup and dropoff spots
-- Migration: 20260501110000_locations_table.sql

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_type TEXT DEFAULT 'BOTH',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations(name);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.set_locations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- RLS policy: all authenticated users can manage locations
DROP POLICY IF EXISTS "authenticated_all_locations" ON public.locations;
CREATE POLICY "authenticated_all_locations"
ON public.locations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger
DROP TRIGGER IF EXISTS set_locations_updated_at ON public.locations;
CREATE TRIGGER set_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_locations_updated_at();

-- Sample locations mock data
DO $$
BEGIN
  INSERT INTO public.locations (id, name, location_type, notes) VALUES
    (gen_random_uuid(), 'KGS AIRPORT', 'PICKUP', 'Kos Island International Airport'),
    (gen_random_uuid(), 'KOS PORT', 'BOTH', 'Main ferry port'),
    (gen_random_uuid(), 'KARDAMENA PORT', 'BOTH', 'Kardamena ferry terminal'),
    (gen_random_uuid(), 'KEFALOS PORT', 'BOTH', 'Kefalos ferry terminal'),
    (gen_random_uuid(), 'CABANA BLU HOTEL', 'DROPOFF', ''),
    (gen_random_uuid(), 'HELIOS HOTEL', 'DROPOFF', ''),
    (gen_random_uuid(), 'ATLANTIS HOTEL', 'DROPOFF', ''),
    (gen_random_uuid(), 'CITY CENTER KOS', 'BOTH', 'Kos Town center'),
    (gen_random_uuid(), 'TIGAKI AREA', 'BOTH', ''),
    (gen_random_uuid(), 'MARMARI AREA', 'BOTH', '')
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
