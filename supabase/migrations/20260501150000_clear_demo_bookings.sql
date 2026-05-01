-- ============================================================
-- Clear all demo/seed bookings from the bookings table
-- Only real bookings (created by users) should remain
-- Timestamp: 20260501150000
-- ============================================================

DO $$
BEGIN
  -- Delete all seeded demo bookings (IDs starting with B-000 pattern from seed data)
  DELETE FROM public.bookings
  WHERE id IN (
    'B-00010', 'B-00011', 'B-00012', 'B-00013', 'B-00014', 'B-00015',
    'B-00016', 'B-00017', 'B-00018', 'B-00019', 'B-00020', 'B-00021',
    'B-00022', 'B-00023', 'B-00024', 'B-00025', 'B-00026', 'B-00027',
    'B-00028', 'B-00029', 'B-00030', 'B-00031', 'B-00032', 'B-00033',
    'B-00034', 'B-00035', 'B-1777628918588'
  );

  RAISE NOTICE 'Demo bookings cleared successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error clearing demo bookings: %', SQLERRM;
END $$;
