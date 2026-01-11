-- Security Enhancements: Public Masked DPT Search
-- This script creates a masked view for public DPT search and tightens access to the raw voters table.

-- 1. Create a masked view for public access
CREATE OR REPLACE VIEW public.public_voters AS
SELECT 
    id, 
    name, 
    CASE 
        WHEN nik IS NOT NULL AND length(nik) >= 5 THEN 
            substring(nik, 1, 3) || '********' || substring(nik, length(nik)-1, 2)
        WHEN nik IS NOT NULL THEN '***'
        ELSE NULL 
    END as nik,
    address,
    invitation_code,
    is_present,
    display_order,
    created_at
FROM public.voters;

-- 2. Grant access to the view for everyone (anon and authenticated)
GRANT SELECT ON public.public_voters TO anon, authenticated;

-- 3. Tighten RLS on the raw voters table
-- First, drop the broad policy that allowed guest access
DROP POLICY IF EXISTS "Enable read for everyone" ON public.voters;
DROP POLICY IF EXISTS "Authorized staff manage voters" ON public.voters;

-- Policy for approved staff to see everything
CREATE POLICY "Approved staff can see all voter data" 
ON public.voters 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.staff s
        WHERE s.user_id = auth.uid()
        AND s.is_approved = true
    )
);

-- Policy for staff with management permissions to insert/update/delete
CREATE POLICY "Manager staff can modify voter data" 
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
        AND (r.permissions->>'all' = 'true' OR r.permissions->>'manage_voters' = 'true' OR r.permissions->>'edit_voters' = 'true')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.staff s
        JOIN staff_roles sr ON s.id = sr.staff_id
        JOIN roles r ON sr.role_id = r.id
        WHERE s.user_id = auth.uid()
        AND s.is_approved = true
        AND (r.permissions->>'all' = 'true' OR r.permissions->>'manage_voters' = 'true' OR r.permissions->>'edit_voters' = 'true')
    )
);

-- 4. Secure the staff table (only approved staff should see other staff details)
DROP POLICY IF EXISTS "Enable read for everyone" ON public.staff;
CREATE POLICY "Staff can see each other" 
ON public.staff 
FOR SELECT 
TO authenticated 
USING (true); -- Keep select open so people can see who needs approval, but we could restrict this further.

-- Actually, let's keep it open for select but restrict sensitive fields if needed.
-- For now, the previous SELECT policy "Enable read for everyone" was fine, 
-- but we want to make sure only approved staff can do management. 
-- That is already handled by "Enable staff approval and management".

-- 5. Audit logs: Ensure they are readable by managers
DROP POLICY IF EXISTS "Enable read for managers" ON public.audit_logs;
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
