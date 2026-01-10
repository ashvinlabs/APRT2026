-- ==========================================
-- CLEAN DATABASE SCRIPT (Keep Users & Staff)
-- ==========================================
-- This script will delete all data EXCEPT:
-- - auth.users (authentication accounts)
-- - public.staff (staff profiles)
-- - public.roles (role definitions)
-- - public.staff_roles (staff role assignments)
-- ==========================================

-- 1. Delete all votes
DELETE FROM public.votes;

-- 2. Delete all voters
DELETE FROM public.voters;

-- 3. Delete all candidates
DELETE FROM public.candidates;

-- 4. Delete all audit logs
DELETE FROM public.audit_logs;

-- 5. Reset settings to default (optional - comment out if you want to keep settings)
DELETE FROM public.settings WHERE id != 'election_config';

-- Insert default election config if it doesn't exist
INSERT INTO public.settings (id, value) 
VALUES ('election_config', '{
  "title": "REKAPITULASI LIVE",
  "location": "Pemilihan Ketua RT",
  "location_detail": "Pelem Kidul",
  "date": "2026-02-01",
  "start_time": "08:00",
  "end_time": "12:00",
  "is_registration_open": true
}'::jsonb)
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these to verify the cleanup:

-- Check remaining data counts
SELECT 
    (SELECT COUNT(*) FROM public.voters) as voters_count,
    (SELECT COUNT(*) FROM public.votes) as votes_count,
    (SELECT COUNT(*) FROM public.candidates) as candidates_count,
    (SELECT COUNT(*) FROM public.staff) as staff_count,
    (SELECT COUNT(*) FROM public.roles) as roles_count,
    (SELECT COUNT(*) FROM public.audit_logs) as audit_logs_count;

-- List all staff members (should still exist)
SELECT id, name, email, is_approved, created_at 
FROM public.staff 
ORDER BY created_at DESC;
