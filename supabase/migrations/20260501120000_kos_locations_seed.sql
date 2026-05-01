-- Seed Kos Island locations: airports, port, hotels, and town areas
-- Migration: 20260501120000_kos_locations_seed.sql

DO $$
BEGIN
  INSERT INTO public.locations (name, location_type, notes) VALUES
    -- AIRPORT / PORT
    ('Kos Airport (KGS)', 'BOTH', 'Kos Island International Airport'),
    ('Kos Port', 'BOTH', 'Main ferry port in Kos Town'),

    -- KOS TOWN
    ('Kos Town - General', 'BOTH', 'Kos Town area'),
    ('Kosta Palace Hotel', 'BOTH', 'Kos Town'),
    ('Kos Aktis Art Hotel', 'BOTH', 'Kos Town'),
    ('Blue Lagoon City Hotel', 'BOTH', 'Kos Town'),
    ('Peridis Family Resort', 'BOTH', 'Kos Town'),
    ('Atlantis Hotel', 'BOTH', 'Kos Town'),
    ('Albergo Gelsomino', 'BOTH', 'Kos Town'),
    ('Kosea Boutique Hotel', 'BOTH', 'Kos Town'),

    -- LAMBI / PSALIDI
    ('Lambi - General', 'BOTH', 'Lambi / Psalidi area'),
    ('Blue Lagoon Resort', 'BOTH', 'Lambi'),
    ('Pelagos Suites Hotel', 'BOTH', 'Lambi'),
    ('Aqua Blu Boutique Hotel', 'BOTH', 'Lambi'),
    ('Lango Design Hotel', 'BOTH', 'Lambi'),
    ('Diamond Deluxe Hotel', 'BOTH', 'Lambi'),
    ('Kipriotis Village Resort', 'BOTH', 'Psalidi'),
    ('Kipriotis Panorama Hotel', 'BOTH', 'Psalidi'),
    ('Kipriotis Maris Suites', 'BOTH', 'Psalidi'),

    -- TIGAKI
    ('Tigaki - General', 'BOTH', 'Tigaki area'),
    ('Astir Odysseus Resort', 'BOTH', 'Tigaki'),
    ('Gaia Village', 'BOTH', 'Tigaki'),
    ('Tigaki Beach Hotel', 'BOTH', 'Tigaki'),
    ('Kos Palace Hotel', 'BOTH', 'Tigaki'),

    -- MARMARI
    ('Marmari - General', 'BOTH', 'Marmari area'),
    ('Caravia Beach Hotel', 'BOTH', 'Marmari'),
    ('Sandy Beach Hotel', 'BOTH', 'Marmari'),
    ('OKU Kos', 'BOTH', 'Marmari'),

    -- MASTICHARI
    ('Mastichari - General', 'BOTH', 'Mastichari area'),
    ('Neptune Hotels Resort', 'BOTH', 'Mastichari'),
    ('Horizon Beach Resort', 'BOTH', 'Mastichari'),
    ('Eurovillage Achilleas', 'BOTH', 'Mastichari'),

    -- KARDAMENA
    ('Kardamena - General', 'BOTH', 'Kardamena area'),
    ('Mitsis Blue Domes', 'BOTH', 'Kardamena'),
    ('Mitsis Norida Beach', 'BOTH', 'Kardamena'),
    ('Mitsis Summer Palace', 'BOTH', 'Kardamena'),
    ('Grand Blue Beach Hotel', 'BOTH', 'Kardamena'),
    ('Helona Resort', 'BOTH', 'Kardamena'),
    ('Laguna Beach Hotel', 'BOTH', 'Kardamena'),

    -- KEFALOS
    ('Kefalos - General', 'BOTH', 'Kefalos area'),
    ('Ikos Aria', 'BOTH', 'Kefalos'),
    ('Blue Lagoon Village', 'BOTH', 'Kefalos'),
    ('Neptune Paradise Hotel', 'BOTH', 'Kefalos')

  ON CONFLICT DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Kos locations seed failed: %', SQLERRM;
END $$;
