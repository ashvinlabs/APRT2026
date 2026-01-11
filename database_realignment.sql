-- =============================================================
-- DATABASE REALIGNMENT SCRIPT: V2 -> MAIN
-- =============================================================
-- Run this script in the Supabase SQL Editor to remove 
-- features added in the digital-voting-v2 branch and 
-- align with the current Main branch code.

-- 1. Remove V2 Specific Views
DROP VIEW IF EXISTS public.public_voters;

-- 2. Remove V2 Specific Functions
DROP FUNCTION IF EXISTS public.search_voter_public(text);

-- 3. Cleanup voters table (if extra columns were added in V2)
-- These columns are not present in the current Main schema.sql
ALTER TABLE public.voters 
DROP COLUMN IF EXISTS has_voted,
DROP COLUMN IF EXISTS voted_at;

-- 4. Re-apply Main branch Policies (Resetting RLS)
-- This ensures policies match schema.sql exactly.

-- Voters Policy
DROP POLICY IF EXISTS "Enable read for everyone" ON public.voters;
CREATE POLICY "Enable read for everyone" ON public.voters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authorized staff manage voters" ON public.voters;
CREATE POLICY "Authorized staff manage voters" ON public.voters FOR ALL TO authenticated USING (true);

-- Settings Policy
DROP POLICY IF EXISTS "Enable read for everyone" ON public.settings;
CREATE POLICY "Enable read for everyone" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.settings;
CREATE POLICY "Enable all for authenticated users" ON public.settings FOR ALL TO authenticated USING (true);

-- 5. Force Schema Reload
NOTIFY pgrst, 'reload schema';

-- =============================================================
-- DIAGNOSTIC / VERIFICATION SECTION
-- =============================================================
-- Run the following queries to verify parity with Production.

-- A. Check if the V2 view is really gone
-- (Should return 0 rows)
SELECT count(*) FROM pg_views WHERE viewname = 'public_voters';

-- B. Check if V2 function is really gone
-- (Should return 0 rows)
SELECT count(*) FROM pg_proc WHERE proname = 'search_voter_public';

-- C. Check Voters Table Structure
-- (Ensure has_voted and voted_at columns are NOT present)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'voters' 
AND column_name IN ('has_voted', 'voted_at');

-- D. Compare Table Counts (Run this in both Staging & Production)
-- The structure names should be identical.
SELECT 
    table_name, 
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.table_name) as policy_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =============================================================
-- SUCCESS: Database aligned with Main branch requirements.
-- =============================================================
