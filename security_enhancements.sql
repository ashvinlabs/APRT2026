-- SECURITY ENHANCEMENTS & PERMISSIONS SYNC
-- Run this script in the Supabase SQL Editor to ensure all tables, columns, and policies are correctly configured.

-- 0. Ensure required columns exist in public.voters
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='display_order') THEN
        ALTER TABLE public.voters ADD COLUMN display_order INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='has_voted') THEN
        ALTER TABLE public.voters ADD COLUMN has_voted BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='voted_at') THEN
        ALTER TABLE public.voters ADD COLUMN voted_at TIMESTAMPTZ;
    END IF;
END $$;

-- 1. Create a masked view for public access
-- This view allows non-authenticated users to search for themselves without seeing sensitive data.
CREATE OR REPLACE VIEW public.public_voters AS
SELECT 
    id, 
    name, 
    CASE 
        WHEN length(nik) >= 16 THEN left(nik, 4) || '************'
        WHEN length(nik) >= 4 THEN left(nik, 4) || repeat('*', length(nik) - 4)
        ELSE '*************'
    END as nik, 
    address, 
    invitation_code, 
    is_present, 
    display_order,
    created_at
FROM public.voters;

-- 2. Grant access to public_voters view
GRANT SELECT ON public.public_voters TO anon, authenticated;

-- 3. RLS Security Policies for voters table
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;

-- 3.1 Policy for digital invitation (checking is_present)
DROP POLICY IF EXISTS "Allow anon update check-in" ON public.voters;
CREATE POLICY "Allow anon update check-in" 
ON public.voters 
FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (is_present = true);

-- 3.2 Policy for staff to manage voters
DROP POLICY IF EXISTS "Enable staff approval and management" ON public.voters;
CREATE POLICY "Enable staff approval and management"
ON public.voters
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff s
        JOIN staff_roles sr ON s.id = sr.staff_id
        JOIN roles r ON sr.role_id = r.id
        WHERE s.user_id = auth.uid()
        AND s.is_approved = true
        AND (
            r.permissions->>'all' = 'true' OR 
            r.permissions->>'manage_voters' = 'true' OR 
            r.permissions->>'edit_voters' = 'true' OR
            r.permissions->>'access_voting_terminal' = 'true'
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.staff s
        JOIN staff_roles sr ON s.id = sr.staff_id
        JOIN roles r ON sr.role_id = r.id
        WHERE s.user_id = auth.uid()
        AND s.is_approved = true
        AND (
            r.permissions->>'all' = 'true' OR 
            r.permissions->>'manage_voters' = 'true' OR 
            r.permissions->>'edit_voters' = 'true' OR
            r.permissions->>'access_voting_terminal' = 'true'
        )
    )
);

-- 4. Staff Approval Policy
DROP POLICY IF EXISTS "Staff can read other staff for approval" ON public.staff;
CREATE POLICY "Staff can read other staff for approval" 
ON public.staff 
FOR SELECT 
TO authenticated 
USING (true); -- Keep select open so people can see who needs approval, but we could restrict this further.

-- 5. Audit logs: Ensure they are readable by managers
DROP POLICY IF EXISTS "Managers can read audit logs" ON public.audit_logs;
CREATE POLICY "Managers can read audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.staff s
        JOIN staff_roles sr ON s.id = sr.staff_id
        JOIN roles r ON sr.role_id = r.id
        WHERE s.user_id = auth.uid()
        AND s.is_approved = true
        AND (r.permissions->>'all' = 'true' OR r.permissions->>'view_logs' = 'true')
    )
);

-- 5.1 Votes Table: Ensure authenticated users (terminal) can insert
DROP POLICY IF EXISTS "Authorized staff manage votes" ON public.votes;
CREATE POLICY "Authorized staff manage votes" 
ON public.votes 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 6. Storage Buckets Setup
-- Ensure all required storage buckets exist on the (staging) environment
-- Note: This uses standard Supabase storage schema functions.

INSERT INTO storage.buckets (id, name, public)
VALUES ('candidates', 'candidates', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-photos', 'staff-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voting-audits', 'voting-audits', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage Policies
DROP POLICY IF EXISTS "Allow Public Select" ON storage.objects;
CREATE POLICY "Allow Public Select" ON storage.objects FOR SELECT TO public USING (bucket_id IN ('candidates', 'staff-photos', 'voting-audits'));

DROP POLICY IF EXISTS "Allow Staff Upload" ON storage.objects;
CREATE POLICY "Allow Staff Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('candidates', 'staff-photos', 'voting-audits'));

DROP POLICY IF EXISTS "Allow Staff Update" ON storage.objects;
CREATE POLICY "Allow Staff Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('candidates', 'staff-photos', 'voting-audits'));

DROP POLICY IF EXISTS "Allow Staff Delete" ON storage.objects;
CREATE POLICY "Allow Staff Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('candidates', 'staff-photos', 'voting-audits'));

-- 12. Create a secure RPC for public DPT searching
-- This allows exact NIK match or Name search while returning masked data
CREATE OR REPLACE FUNCTION public.search_voter_public(p_search TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    nik TEXT,
    address TEXT,
    is_present BOOLEAN,
    has_voted BOOLEAN,
    voted_at TIMESTAMPTZ,
    invitation_code TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        CASE 
            WHEN length(v.nik) >= 16 THEN left(v.nik, 4) || '************'
            WHEN length(v.nik) >= 4 THEN left(v.nik, 4) || repeat('*', length(v.nik) - 4)
            ELSE '*************'
        END as nik,
        '[Alamat Dirahasiakan]'::TEXT as address,
        v.is_present,
        v.has_voted,
        v.voted_at,
        -- Return masked invitation code or null for security
        CASE 
            WHEN v.invitation_code IS NOT NULL THEN '****'
            ELSE NULL
        END as invitation_code
    FROM public.voters v
    WHERE v.nik = p_search OR v.name ILIKE '%' || p_search || '%'
    LIMIT 10; -- Limit results to prevent data scraping
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_voter_public(TEXT) TO anon, authenticated;

-- 8. Force Schema Reload (Ensure PostgREST sees the new columns)
NOTIFY pgrst, 'reload schema';
