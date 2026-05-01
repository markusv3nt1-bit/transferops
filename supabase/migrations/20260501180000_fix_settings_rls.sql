-- ============================================================
-- TransferOps: Fix Settings RLS Policies
-- Fixes company_settings and user_profiles RLS so that
-- authenticated owners/managers can save changes
-- ============================================================

-- Re-create is_admin_or_owner with SET search_path to avoid issues
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND role IN ('owner'::public.user_role, 'manager'::public.user_role)
  );
$$;

-- Re-create get_current_user_role with SET search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ── company_settings: drop and recreate all policies ──────────────────────────

DROP POLICY IF EXISTS "authenticated_read_company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "admins_update_company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "admins_insert_company_settings" ON public.company_settings;

-- All authenticated users can read
CREATE POLICY "authenticated_read_company_settings"
ON public.company_settings FOR SELECT TO authenticated
USING (true);

-- Owners/managers can update
CREATE POLICY "admins_update_company_settings"
ON public.company_settings FOR UPDATE TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- Owners/managers can insert
CREATE POLICY "admins_insert_company_settings"
ON public.company_settings FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner());

-- ── user_profiles: fix update policy to allow admins to update any profile ────

DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;

-- Users can update their own profile; admins can update any profile
CREATE POLICY "users_update_own_profile"
ON public.user_profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.is_admin_or_owner())
WITH CHECK (id = auth.uid() OR public.is_admin_or_owner());

-- Ensure admins_insert_profiles policy exists
DROP POLICY IF EXISTS "admins_insert_profiles" ON public.user_profiles;
CREATE POLICY "admins_insert_profiles"
ON public.user_profiles FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner());
