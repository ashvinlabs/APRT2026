-- =============================================================
-- FINAL SYNC SCRIPT: PRODUCTION -> STAGING
-- =============================================================
-- This script will make the Staging (APRT2026) database 
-- identical to the Production (APRT2026-prod) database.

-- 1. CLEANUP V2 EXTRAS (If any)
DROP VIEW IF EXISTS public.public_voters;
DROP FUNCTION IF EXISTS public.search_voter_public(text);
ALTER TABLE public.voters DROP COLUMN IF EXISTS has_voted;
ALTER TABLE public.voters DROP COLUMN IF EXISTS voted_at;

-- 2. ADD MISSING COLUMNS TO STAGING
-- Based on Prod: staff (9 columns), voters (11 columns)

-- Staff Table Fixes
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Voters Table Fixes
ALTER TABLE public.voters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. ALIGN RLS POLICIES (DROP ALL AND RE-APPLY FROM PRODUCTION SCHEMA)

-- Audit Logs
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable write for authenticated users" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable write for authenticated" ON public.audit_logs;
CREATE POLICY "Enable write for authenticated" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Candidates
DROP POLICY IF EXISTS "Enable delete for testing" ON public.candidates;
DROP POLICY IF EXISTS "Enable insert for testing" ON public.candidates;
DROP POLICY IF EXISTS "Enable read for everyone" ON public.candidates;
DROP POLICY IF EXISTS "Enable update for testing" ON public.candidates;
CREATE POLICY "Enable read for everyone" ON public.candidates FOR SELECT USING (true);

-- Roles
DROP POLICY IF EXISTS "Enable read for everyone" ON public.roles;
CREATE POLICY "Enable read for everyone" ON public.roles FOR SELECT USING (true);
-- Add missing Role management policies from Prod
DROP POLICY IF EXISTS "Enable role management for authorized staff" ON public.roles;
CREATE POLICY "Enable role management for authorized staff" ON public.roles 
FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM staff s
        JOIN staff_roles sr ON s.id = sr.staff_id
        JOIN roles r ON sr.role_id = r.id
        WHERE s.user_id = auth.uid()
        AND s.is_approved = true
        AND (r.permissions->>'all' = 'true' OR r.permissions->>'manage_roles' = 'true')
    )
);

-- Settings
DROP POLICY IF EXISTS "Enable read for everyone" ON public.settings;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.settings;
CREATE POLICY "Enable read for everyone" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.settings FOR ALL TO authenticated USING (true);

-- Staff
DROP POLICY IF EXISTS "Enable read for everyone" ON public.staff;
DROP POLICY IF EXISTS "Enable staff approval and management" ON public.staff;
DROP POLICY IF EXISTS "Enable staff registration" ON public.staff;
DROP POLICY IF EXISTS "Enable staff deletion" ON public.staff;
CREATE POLICY "Enable read for everyone" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Enable staff registration" ON public.staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable staff deletion" ON public.staff FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM roles r JOIN staff_roles sr ON r.id = sr.role_id JOIN staff s ON sr.staff_id = s.id WHERE s.user_id = auth.uid() AND r.permissions->>'all' = 'true')
);

-- Voters
DROP POLICY IF EXISTS "Authorized staff manage voters" ON public.voters;
DROP POLICY IF EXISTS "Enable read for everyone" ON public.voters;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.voters;
CREATE POLICY "Enable read for everyone" ON public.voters FOR SELECT USING (true);
CREATE POLICY "Authorized staff manage voters" ON public.voters FOR ALL TO authenticated USING (true);

-- Votes
DROP POLICY IF EXISTS "Authorized staff manage votes" ON public.votes;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.votes;
CREATE POLICY "Authorized staff manage votes" ON public.votes FOR ALL TO authenticated USING (true);

-- 4. RE-NOTIFY POSTGREST
NOTIFY pgrst, 'reload schema';

-- =============================================================
-- FINAL VERIFICATION QUERY (Run this after)
-- =============================================================
-- SELECT table_name, count(*) as column_count FROM information_schema.columns 
-- WHERE table_schema = 'public' GROUP BY table_name;
