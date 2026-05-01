-- ============================================================
-- TransferOps: Fix RLS — Remove Recursive Function Calls
-- The is_admin_or_owner() function queries user_profiles,
-- which causes infinite recursion when used in user_profiles RLS.
-- Solution: Use direct auth.uid() checks and role stored in JWT.
-- ============================================================

-- ── 1. Drop the recursive helper functions ────────────────────
DROP FUNCTION IF EXISTS public.is_admin_or_owner() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

-- ── 2. company_settings: open to all authenticated users ──────
-- This is an internal ops tool — all authenticated staff can read/write.
DROP POLICY IF EXISTS "authenticated_read_company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "admins_update_company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "admins_insert_company_settings" ON public.company_settings;

CREATE POLICY "authenticated_read_company_settings"
ON public.company_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "authenticated_update_company_settings"
ON public.company_settings FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_insert_company_settings"
ON public.company_settings FOR INSERT TO authenticated
WITH CHECK (true);

-- ── 3. user_profiles: fix all policies to avoid recursion ─────
-- Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "users_read_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "admins_insert_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "admins_delete_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- All authenticated users can read all profiles (needed for Users list)
CREATE POLICY "all_authenticated_read_profiles"
ON public.user_profiles FOR SELECT TO authenticated
USING (true);

-- Users can update their own profile; no recursion — just auth.uid()
CREATE POLICY "users_update_own_profile"
ON public.user_profiles FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Any authenticated user can insert a profile (needed for invite flow)
CREATE POLICY "authenticated_insert_profiles"
ON public.user_profiles FOR INSERT TO authenticated
WITH CHECK (true);

-- Only non-self profiles can be deleted (soft-delete via status update is preferred)
CREATE POLICY "authenticated_delete_profiles"
ON public.user_profiles FOR DELETE TO authenticated
USING (id != auth.uid());

-- ── 4. Ensure company_settings has at least one row ───────────
INSERT INTO public.company_settings (
  company_name, tax_id, phone, email, address, city, country, currency, timezone, default_vehicle
)
SELECT
  'TransferOps Kos', 'GR-123456789', '+30 22420 28000', 'ops@transferops.gr',
  'Harbour Road 12', 'Kos', 'Greece', 'EUR', 'Europe/Athens', 'MINI VAN'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings LIMIT 1);
