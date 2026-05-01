-- ============================================================
-- TransferOps Schema Push Migration
-- Tables: user_profiles, agencies, drivers, vehicles, bookings
-- Timestamp: 20260501091655 (higher than initial 20260501080000)
-- ============================================================

-- 1. DROP TABLES FIRST (reverse dependency order), then ENUM TYPES
-- This prevents CASCADE on DROP TYPE from silently removing columns
-- while CREATE TABLE IF NOT EXISTS skips recreation of existing tables.

DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

DROP TYPE IF EXISTS public.booking_status CASCADE;
DROP TYPE IF EXISTS public.driver_status CASCADE;
DROP TYPE IF EXISTS public.vehicle_status CASCADE;
DROP TYPE IF EXISTS public.vehicle_type CASCADE;
DROP TYPE IF EXISTS public.agency_status CASCADE;

-- 2. ENUM TYPES
CREATE TYPE public.driver_status AS ENUM ('AVAILABLE', 'ON TRIP', 'OFF DUTY');
CREATE TYPE public.vehicle_status AS ENUM ('AVAILABLE', 'ON TRIP', 'MAINTENANCE');
CREATE TYPE public.vehicle_type AS ENUM ('MINI VAN', 'SUV', 'SEDAN', 'BUS');
CREATE TYPE public.booking_status AS ENUM ('CONFIRMED', 'PENDING', 'CANCELLED', 'IN PROGRESS');
CREATE TYPE public.agency_status AS ENUM ('ACTIVE', 'INACTIVE');

-- 3. CORE TABLES

-- user_profiles (linked to auth.users via trigger)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- agencies
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  bookings_month INTEGER DEFAULT 0,
  revenue_month NUMERIC(10,2) DEFAULT 0,
  commission NUMERIC(5,2) DEFAULT 0,
  agency_status public.agency_status DEFAULT 'ACTIVE'::public.agency_status,
  since TEXT DEFAULT '',
  country TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- drivers
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  vehicle_type public.vehicle_type,
  plate TEXT DEFAULT '',
  driver_status public.driver_status DEFAULT 'AVAILABLE'::public.driver_status,
  trips_today INTEGER DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 5.0,
  license TEXT DEFAULT '',
  agency TEXT DEFAULT '',
  join_date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL UNIQUE,
  vehicle_type public.vehicle_type DEFAULT 'MINI VAN'::public.vehicle_type,
  capacity INTEGER DEFAULT 8,
  driver TEXT DEFAULT '',
  vehicle_status public.vehicle_status DEFAULT 'AVAILABLE'::public.vehicle_status,
  trips_today INTEGER DEFAULT 0,
  year INTEGER DEFAULT 2020,
  color TEXT DEFAULT '',
  last_service TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- bookings
CREATE TABLE public.bookings (
  id TEXT PRIMARY KEY,
  booking_date TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  flight TEXT DEFAULT '',
  pax INTEGER DEFAULT 1,
  customer TEXT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  vehicle TEXT DEFAULT '',
  driver TEXT DEFAULT '',
  driver_phone TEXT DEFAULT '',
  booking_status public.booking_status DEFAULT 'PENDING'::public.booking_status,
  price NUMERIC(10,2) DEFAULT 0,
  agency TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(driver_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(vehicle_status);
CREATE INDEX IF NOT EXISTS idx_agencies_status ON public.agencies(agency_status);

-- 5. FUNCTIONS

-- Auto-create user_profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Updated_at auto-update function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 6. ENABLE RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES

-- user_profiles: users manage their own profile
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- agencies: authenticated users can do all
DROP POLICY IF EXISTS "authenticated_all_agencies" ON public.agencies;
CREATE POLICY "authenticated_all_agencies"
ON public.agencies FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- drivers: authenticated users can do all
DROP POLICY IF EXISTS "authenticated_all_drivers" ON public.drivers;
CREATE POLICY "authenticated_all_drivers"
ON public.drivers FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- vehicles: authenticated users can do all
DROP POLICY IF EXISTS "authenticated_all_vehicles" ON public.vehicles;
CREATE POLICY "authenticated_all_vehicles"
ON public.vehicles FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- bookings: authenticated users can do all
DROP POLICY IF EXISTS "authenticated_all_bookings" ON public.bookings;
CREATE POLICY "authenticated_all_bookings"
ON public.bookings FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 8. TRIGGERS

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS set_agencies_updated_at ON public.agencies;
CREATE TRIGGER set_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_drivers_updated_at ON public.drivers;
CREATE TRIGGER set_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER set_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_bookings_updated_at ON public.bookings;
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. MOCK DATA

-- Agencies
DO $$
BEGIN
  INSERT INTO public.agencies (id, name, contact, phone, email, bookings_month, revenue_month, commission, agency_status, since, country) VALUES
    (gen_random_uuid(), 'KGS Travel', 'Andreas Kostopoulos', '+30 22420 28000', 'info@kgstravel.gr', 142, 8540, 12, 'ACTIVE'::public.agency_status, 'Jan 2019', 'Greece'),
    (gen_random_uuid(), 'Helios Travel', 'Maria Stavridou', '+30 22420 31500', 'booking@heliostravel.gr', 87, 5220, 10, 'ACTIVE'::public.agency_status, 'Mar 2020', 'Greece'),
    (gen_random_uuid(), 'Aegean Tours', 'Nikos Papadimitriou', '+30 22420 44200', 'ops@aegeantours.gr', 64, 3840, 11, 'ACTIVE'::public.agency_status, 'Jun 2020', 'Greece'),
    (gen_random_uuid(), 'Blue Horizon Transfers', 'Eleni Christodoulou', '+30 22420 55100', 'transfers@bluehorizon.gr', 39, 2340, 9, 'ACTIVE'::public.agency_status, 'Sep 2021', 'Greece'),
    (gen_random_uuid(), 'Direct Booking', 'Admin', '+30 22420 10000', 'admin@transferops.gr', 28, 1680, 0, 'ACTIVE'::public.agency_status, 'Jan 2019', 'Greece'),
    (gen_random_uuid(), 'Sunway Holidays', 'Peter Muller', '+49 89 12345678', 'groups@sunway.de', 22, 1320, 13, 'ACTIVE'::public.agency_status, 'Apr 2022', 'Germany'),
    (gen_random_uuid(), 'Mediterranean Escapes', 'Sophie Laurent', '+33 1 23456789', 'sophie@med-escapes.fr', 15, 900, 10, 'INACTIVE'::public.agency_status, 'Jul 2022', 'France'),
    (gen_random_uuid(), 'Island Connect', 'James Harrison', '+44 20 71234567', 'james@islandconnect.co.uk', 11, 660, 12, 'INACTIVE'::public.agency_status, 'Nov 2022', 'UK')
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Agency mock data error: %', SQLERRM;
END $$;

-- Drivers
DO $$
BEGIN
  INSERT INTO public.drivers (id, name, phone, vehicle_type, plate, driver_status, trips_today, rating, license, agency, join_date) VALUES
    (gen_random_uuid(), 'John Dimitriou', '+30 691 522 7258', 'MINI VAN'::public.vehicle_type, 'KOS-1142', 'ON TRIP'::public.driver_status, 3, 4.9, 'GR-DL-2019-0041', 'KGS', '12 Mar 2021'),
    (gen_random_uuid(), 'Mike Tsoukalas', '+30 697 811 3344', 'MINI VAN'::public.vehicle_type, 'KOS-2278', 'AVAILABLE'::public.driver_status, 2, 4.7, 'GR-DL-2017-0112', 'KGS', '05 Jun 2020'),
    (gen_random_uuid(), 'Kiwi Papadopoulos', '+30 691 522 7258', 'SUV'::public.vehicle_type, 'KOS-3390', 'ON TRIP'::public.driver_status, 4, 4.8, 'GR-DL-2018-0087', 'KGS', '20 Jan 2022'),
    (gen_random_uuid(), 'Astron Nikolaou', '+30 697 455 2210', 'SUV'::public.vehicle_type, 'KOS-4411', 'AVAILABLE'::public.driver_status, 2, 4.6, 'GR-DL-2020-0203', 'KGS', '08 Sep 2022'),
    (gen_random_uuid(), 'Stavros Georgiou', '+30 693 100 5599', 'SEDAN'::public.vehicle_type, 'KOS-5522', 'OFF DUTY'::public.driver_status, 0, 4.4, 'GR-DL-2015-0334', 'HELIOS TRAVEL', '14 Feb 2019'),
    (gen_random_uuid(), 'Nikos Papadakis', '+30 694 233 8877', 'BUS'::public.vehicle_type, 'KOS-6633', 'AVAILABLE'::public.driver_status, 1, 4.5, 'GR-DL-2016-0445', 'AEGEAN TOURS', '29 Nov 2020'),
    (gen_random_uuid(), 'Yiannis Stavrakis', '+30 698 766 1122', 'MINI VAN'::public.vehicle_type, 'KOS-7744', 'ON TRIP'::public.driver_status, 5, 4.9, 'GR-DL-2014-0556', 'KGS', '03 Apr 2018'),
    (gen_random_uuid(), 'Petros Alexiou', '+30 695 344 6600', 'SUV'::public.vehicle_type, 'KOS-8855', 'OFF DUTY'::public.driver_status, 0, 4.3, 'GR-DL-2021-0667', 'DIRECT', '17 Jul 2023'),
    (gen_random_uuid(), 'Kostas Manolis', '+30 691 877 4433', 'SEDAN'::public.vehicle_type, 'KOS-9966', 'AVAILABLE'::public.driver_status, 1, 4.7, 'GR-DL-2019-0778', 'KGS', '22 Oct 2021'),
    (gen_random_uuid(), 'Dimitris Raptis', '+30 697 922 1155', 'MINI VAN'::public.vehicle_type, 'KOS-1077', 'ON TRIP'::public.driver_status, 3, 4.8, 'GR-DL-2017-0889', 'HELIOS TRAVEL', '11 May 2020')
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Driver mock data error: %', SQLERRM;
END $$;

-- Vehicles
DO $$
BEGIN
  INSERT INTO public.vehicles (id, plate, vehicle_type, capacity, driver, vehicle_status, trips_today, year, color, last_service) VALUES
    (gen_random_uuid(), 'KOS-1142', 'MINI VAN'::public.vehicle_type, 8, 'John D.', 'ON TRIP'::public.vehicle_status, 3, 2021, 'White', '15 Mar 2026'),
    (gen_random_uuid(), 'KOS-2278', 'MINI VAN'::public.vehicle_type, 8, 'Mike T.', 'AVAILABLE'::public.vehicle_status, 2, 2022, 'Silver', '02 Apr 2026'),
    (gen_random_uuid(), 'KOS-3390', 'SUV'::public.vehicle_type, 6, 'Kiwi', 'ON TRIP'::public.vehicle_status, 4, 2020, 'Black', '28 Mar 2026'),
    (gen_random_uuid(), 'KOS-4411', 'SUV'::public.vehicle_type, 6, 'Astron', 'AVAILABLE'::public.vehicle_status, 2, 2023, 'Dark Grey', '10 Apr 2026'),
    (gen_random_uuid(), 'KOS-5522', 'SEDAN'::public.vehicle_type, 4, 'Stavros G.', 'MAINTENANCE'::public.vehicle_status, 0, 2019, 'White', '01 Jan 2026'),
    (gen_random_uuid(), 'KOS-6633', 'BUS'::public.vehicle_type, 20, 'Nikos P.', 'AVAILABLE'::public.vehicle_status, 1, 2020, 'White', '22 Apr 2026'),
    (gen_random_uuid(), 'KOS-7744', 'MINI VAN'::public.vehicle_type, 8, 'Yiannis S.', 'ON TRIP'::public.vehicle_status, 5, 2022, 'Silver', '18 Apr 2026'),
    (gen_random_uuid(), 'KOS-8855', 'SUV'::public.vehicle_type, 6, 'Petros A.', 'MAINTENANCE'::public.vehicle_status, 0, 2018, 'Black', '10 Feb 2026'),
    (gen_random_uuid(), 'KOS-9966', 'SEDAN'::public.vehicle_type, 4, 'Kostas M.', 'AVAILABLE'::public.vehicle_status, 1, 2021, 'White', '05 Apr 2026'),
    (gen_random_uuid(), 'KOS-1077', 'MINI VAN'::public.vehicle_type, 8, 'Dimitris R.', 'ON TRIP'::public.vehicle_status, 3, 2023, 'Silver', '24 Apr 2026')
  ON CONFLICT (plate) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Vehicle mock data error: %', SQLERRM;
END $$;

-- Bookings
DO $$
BEGIN
  INSERT INTO public.bookings (id, booking_date, booking_time, flight, pax, customer, from_location, to_location, vehicle, driver, driver_phone, booking_status, price, agency, phone, notes) VALUES
    ('B-00017', '01 May 2026', '12:00', 'KL1234', 10, 'van der Splinter Marco, van Veen Thilly, Oppermann Pieter', 'KOS AIRPORT', 'CASA PARADISO', 'MINI VAN', 'John D.', '+30 691 522 7258', 'CONFIRMED'::public.booking_status, 120, 'KGS', '4915227225854', ''),
    ('B-00018', '01 May 2026', '13:00', 'BA2345', 11, 'Bas Kotter', 'BLUE DOMES AIRPORT', 'KGS', 'MINI VAN', 'Mike T.', '+30 697 811 3344', 'PENDING'::public.booking_status, 150, 'KGS', '4915227225855', 'Extra luggage requested'),
    ('B-00019', '01 May 2026', '17:15', 'EW9636', 1, 'SELVI/ANGGRAENI', 'KGS AIRPORT', 'CABANA BLU HOTEL', 'SUV', 'Kiwi', '+30 691 522 7258', 'CONFIRMED'::public.booking_status, 50, 'KGS', '4915227225854', ''),
    ('B-00020', '01 May 2026', '22:00', 'FR9290', 3, 'MC MONAGLE RUTH', 'KGS AIRPORT', 'ASTRON SUITES', 'SUV', 'Astron', '+30 697 455 2210', 'CONFIRMED'::public.booking_status, 70, 'KGS', '4915227225856', ''),
    ('B-00021', '01 May 2026', '09:10', 'A3905', 2, 'Muller Family', 'KGS AIRPORT', 'LAMBI HOTEL', 'MINI VAN', 'John D.', '+30 691 522 7258', 'PENDING'::public.booking_status, 40, 'KGS', '4915227225857', 'Baby seat required'),
    ('B-00022', '01 May 2026', '11:30', 'LH1752', 4, 'Smith / Brown', 'KGS AIRPORT', 'MARMARI BAY', 'MINI VAN', 'Mike T.', '+30 697 811 3344', 'PENDING'::public.booking_status, 80, 'KGS', '4915227225858', ''),
    ('B-00023', '01 May 2026', '15:45', 'AEE123', 2, 'Rossi Mario', 'KGS AIRPORT', 'THEROS SUITES', 'SUV', 'Kiwi', '+30 691 522 7258', 'CONFIRMED'::public.booking_status, 45, 'KGS', '4915227225859', ''),
    ('B-00024', '01 May 2026', '19:20', 'BA6777', 5, 'Peterson Group', 'KGS AIRPORT', 'MICHELANGELO', 'MINI VAN', 'Astron', '+30 697 455 2210', 'PENDING'::public.booking_status, 100, 'KGS', '4915227225860', 'VIP priority pickup'),
    ('B-00025', '01 May 2026', '21:10', 'EW2421', 1, 'Ivanov A.', 'KGS AIRPORT', 'SEA BREEZE', 'SEDAN', 'John D.', '+30 691 522 7258', 'CONFIRMED'::public.booking_status, 30, 'KGS', '4915227225861', ''),
    ('B-00026', '01 May 2026', '07:50', 'FR5501', 2, 'Garcia Lopez', 'KGS AIRPORT', 'D ANDREA LAGO', 'MINI VAN', 'Mike T.', '+30 697 811 3344', 'PENDING'::public.booking_status, 40, 'KGS', '4915227225862', ''),
    ('B-00027', '01 May 2026', '14:30', 'OS7712', 6, 'Weber / Schneider', 'KGS AIRPORT', 'PSALIDI BEACH', 'MINI VAN', 'Kiwi', '+30 691 522 7258', 'CONFIRMED'::public.booking_status, 90, 'KGS', '4915227225863', ''),
    ('B-00028', '01 May 2026', '23:45', 'U22901', 3, 'Nakamura T.', 'KGS AIRPORT', 'KEFALOS VILLAGE', 'SUV', 'Astron', '+30 697 455 2210', 'PENDING'::public.booking_status, 65, 'KGS', '4915227225864', 'Late night confirm 1hr before'),
    ('B-00010', '30 Apr 2026', '08:30', 'FR1100', 2, 'Hoffmann Klaus', 'KGS AIRPORT', 'OCEAN PALACE', 'SEDAN', 'John D.', '+30 691 522 7258', 'CONFIRMED'::public.booking_status, 35, 'KGS', '4915227225870', ''),
    ('B-00011', '30 Apr 2026', '11:00', 'EW3344', 4, 'Lindqvist Family', 'KGS AIRPORT', 'BLUE LAGOON RESORT', 'MINI VAN', 'Mike T.', '+30 697 811 3344', 'CONFIRMED'::public.booking_status, 75, 'KGS', '4915227225871', ''),
    ('B-00012', '30 Apr 2026', '16:20', 'BA9910', 3, 'Patel / Gupta', 'KGS AIRPORT', 'IMPERIAL SUITES', 'SUV', 'Kiwi', '+30 691 522 7258', 'PENDING'::public.booking_status, 60, 'KGS', '4915227225872', ''),
    ('B-00030', '02 May 2026', '10:15', 'LH4422', 5, 'Braun / Fischer', 'KGS AIRPORT', 'ATLANTIS RESORT', 'MINI VAN', 'John D.', '+30 691 522 7258', 'PENDING'::public.booking_status, 95, 'KGS', '4915227225880', ''),
    ('B-00031', '02 May 2026', '14:00', 'AEE556', 2, 'Torres Elena', 'KGS AIRPORT', 'SUNSET VILLAS', 'SEDAN', 'Astron', '+30 697 455 2210', 'CONFIRMED'::public.booking_status, 45, 'KGS', '4915227225881', '')
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Booking mock data error: %', SQLERRM;
END $$;
