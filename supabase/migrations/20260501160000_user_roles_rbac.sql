-- ============================================================
-- TransferOps: User Roles & RBAC Migration
-- Adds role column to user_profiles, role-based RLS helpers,
-- and seeds demo users for multi-user login testing
-- ============================================================

-- 1. ROLE ENUM
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('owner', 'manager', 'dispatcher', 'viewer');

-- 2. Add role + status columns to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'dispatcher'::public.user_role,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- 3. ROLE HELPER FUNCTIONS (created BEFORE RLS policies)

-- Returns current user's role from user_profiles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::TEXT FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Returns true if current user is owner or manager
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND role IN ('owner'::public.user_role, 'manager'::public.user_role)
  );
$$;

-- 4. UPDATE user_profiles RLS POLICIES

-- Drop old policy
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- Users can read their own profile
DROP POLICY IF EXISTS "users_read_own_profile" ON public.user_profiles;
CREATE POLICY "users_read_own_profile"
ON public.user_profiles FOR SELECT TO authenticated
USING (true);

-- Users can update their own profile only
DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
CREATE POLICY "users_update_own_profile"
ON public.user_profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Only owners/managers can insert new profiles (invite flow)
DROP POLICY IF EXISTS "admins_insert_profiles" ON public.user_profiles;
CREATE POLICY "admins_insert_profiles"
ON public.user_profiles FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner());

-- Only owners/managers can delete profiles
DROP POLICY IF EXISTS "admins_delete_profiles" ON public.user_profiles;
CREATE POLICY "admins_delete_profiles"
ON public.user_profiles FOR DELETE TO authenticated
USING (public.is_admin_or_owner() AND id != auth.uid());

-- 5. UPDATE handle_new_user TRIGGER to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'dispatcher')::public.user_role,
    'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, public.user_profiles.role),
    status = COALESCE(EXCLUDED.status, public.user_profiles.status);
  RETURN NEW;
END;
$$;

-- Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. SEED DEMO USERS (multi-user login)
DO $$
DECLARE
  owner_uuid   UUID := gen_random_uuid();
  manager_uuid UUID := gen_random_uuid();
  disp_uuid    UUID := gen_random_uuid();
  viewer_uuid  UUID := gen_random_uuid();
BEGIN
  -- Insert into auth.users (trigger will create user_profiles automatically)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES
    (
      owner_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin@transferops.gr', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'Admin Owner', 'role', 'owner'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ),
    (
      manager_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'manager@transferops.gr', crypt('manager123', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'Eleni Stavridou', 'role', 'manager'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ),
    (
      disp_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'dispatcher@transferops.gr', crypt('dispatcher123', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'Kostas Raptis', 'role', 'dispatcher'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ),
    (
      viewer_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'viewer@transferops.gr', crypt('viewer123', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'Maria Georgiou', 'role', 'viewer'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    )
  ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Demo user seed error: %', SQLERRM;
END $$;
