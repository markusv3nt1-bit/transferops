-- ============================================================
-- Add MINI BUS and LIMO to vehicle_type ENUM
-- Timestamp: 20260501130000
-- ============================================================

-- ALTER TYPE ... ADD VALUE is safe and does not require dropping the type
-- or any dependent tables/columns. It is also idempotent-safe via IF NOT EXISTS.

ALTER TYPE public.vehicle_type ADD VALUE IF NOT EXISTS 'MINI BUS';
ALTER TYPE public.vehicle_type ADD VALUE IF NOT EXISTS 'LIMO';
