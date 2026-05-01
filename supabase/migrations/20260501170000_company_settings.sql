-- ============================================================
-- TransferOps: Company Settings Table
-- Stores company profile data (single row per company)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT '',
  tax_id TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'EUR',
  timezone TEXT NOT NULL DEFAULT 'Europe/Athens',
  default_vehicle TEXT NOT NULL DEFAULT 'MINI VAN',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_company_settings_id ON public.company_settings(id);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read company settings
DROP POLICY IF EXISTS "authenticated_read_company_settings" ON public.company_settings;
CREATE POLICY "authenticated_read_company_settings"
ON public.company_settings FOR SELECT TO authenticated
USING (true);

-- Only owners/managers can update company settings
DROP POLICY IF EXISTS "admins_update_company_settings" ON public.company_settings;
CREATE POLICY "admins_update_company_settings"
ON public.company_settings FOR UPDATE TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- Only owners/managers can insert company settings
DROP POLICY IF EXISTS "admins_insert_company_settings" ON public.company_settings;
CREATE POLICY "admins_insert_company_settings"
ON public.company_settings FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner());

-- Seed default company profile (idempotent)
INSERT INTO public.company_settings (
  company_name, tax_id, phone, email, address, city, country, currency, timezone, default_vehicle
) VALUES (
  'TransferOps Kos',
  'GR-123456789',
  '+30 22420 28000',
  'ops@transferops.gr',
  'Harbour Road 12',
  'Kos',
  'Greece',
  'EUR',
  'Europe/Athens',
  'MINI VAN'
)
ON CONFLICT DO NOTHING;
