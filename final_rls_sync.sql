-- =============================================================
-- DEFINITIVE RLS SYNC SCRIPT: PRODUCTION -> STAGING (FIXED FINAL)
-- =============================================================
-- This script mirrors ALL 25+ policies from Production exactly.

-- 0. CLEANUP EXISTING POLICIES ON STAGING
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP; 
END $$;

-- 1. AUDIT_LOGS
CREATE POLICY "Enable write for authenticated" ON public.audit_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Managers can read audit logs" ON public.audit_logs FOR SELECT TO public USING (
    EXISTS ( SELECT 1 FROM staff s JOIN staff_roles sr ON s.id = sr.staff_id JOIN roles r ON sr.role_id = r.id 
    WHERE s.user_id = auth.uid() AND s.is_approved = true AND ((r.permissions ->> 'all'::text) = 'true'::text OR (r.permissions ->> 'view_logs'::text) = 'true'::text))
);

-- 2. CANDIDATES
CREATE POLICY "Admin manage candidates" ON public.candidates FOR ALL TO public USING (
    EXISTS ( SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.is_approved = true )
);
CREATE POLICY "Enable manage for authenticated" ON public.candidates FOR ALL TO public USING (
    EXISTS ( SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.is_approved = true )
);
CREATE POLICY "Enable read for everyone" ON public.candidates FOR SELECT TO public USING (true);

-- 3. ROLES
CREATE POLICY "Admin can delete roles" ON public.roles FOR DELETE TO public USING (
    EXISTS ( SELECT 1 FROM staff s JOIN staff_roles sr ON s.id = sr.staff_id JOIN roles r ON sr.role_id = r.id 
    WHERE s.user_id = auth.uid() AND s.is_approved = true AND ((r.permissions ->> 'all'::text) = 'true'::text OR (r.permissions ->> 'manage_roles'::text) = 'true'::text))
);
CREATE POLICY "Admin can insert roles" ON public.roles FOR INSERT TO public WITH CHECK (
    EXISTS ( SELECT 1 FROM staff s JOIN staff_roles sr ON s.id = sr.staff_id JOIN roles r ON sr.role_id = r.id 
    WHERE s.user_id = auth.uid() AND s.is_approved = true AND ((r.permissions ->> 'all'::text) = 'true'::text OR (r.permissions ->> 'manage_roles'::text) = 'true'::text))
);
CREATE POLICY "Admin can update roles" ON public.roles FOR UPDATE TO public USING (
    EXISTS ( SELECT 1 FROM staff s JOIN staff_roles sr ON s.id = sr.staff_id JOIN roles r ON sr.role_id = r.id 
    WHERE s.user_id = auth.uid() AND s.is_approved = true AND ((r.permissions ->> 'all'::text) = 'true'::text OR (r.permissions ->> 'manage_roles'::text) = 'true'::text))
);
CREATE POLICY "Enable read access for authenticated users" ON public.roles FOR SELECT TO public USING (true);
CREATE POLICY "Enable read for everyone" ON public.roles FOR SELECT TO public USING (true);

-- 4. SETTINGS
CREATE POLICY "Enable all for authenticated users" ON public.settings FOR ALL TO public USING (true);
CREATE POLICY "Enable read for everyone" ON public.settings FOR SELECT TO public USING (true);

-- 5. STAFF
CREATE POLICY "Enable staff approval and management" ON public.staff FOR UPDATE TO public USING (
    (EXISTS ( SELECT 1 FROM staff s JOIN staff_roles sr ON s.id = sr.staff_id JOIN roles r ON sr.role_id = r.id 
    WHERE s.user_id = auth.uid() AND s.is_approved = true AND ((r.permissions ->> 'all'::text) = 'true'::text OR (r.permissions ->> 'manage_staff'::text) = 'true'::text))) 
    OR (user_id = auth.uid())
);
CREATE POLICY "Enable staff deletion" ON public.staff FOR DELETE TO public USING (
    EXISTS ( SELECT 1 FROM staff s JOIN staff_roles sr ON s.id = sr.staff_id JOIN roles r ON sr.role_id = r.id 
    WHERE s.user_id = auth.uid() AND s.is_approved = true AND ((r.permissions ->> 'all'::text) = 'true'::text OR (r.permissions ->> 'manage_staff'::text) = 'true'::text))
);
CREATE POLICY "Enable staff registration" ON public.staff FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Staff can see each other" ON public.staff FOR SELECT TO public USING (true);

-- 6. STAFF_ROLES
CREATE POLICY "Enable read for everyone" ON public.staff_roles FOR SELECT TO public USING (true);
CREATE POLICY "Enable staff role assignment" ON public.staff_roles FOR ALL TO public USING (true);

-- 7. VOTERS
CREATE POLICY "Admin manage voters delete" ON public.voters FOR DELETE TO public USING (
    EXISTS ( SELECT 1 FROM staff s JOIN staff_roles sr ON s.id = sr.staff_id JOIN roles r ON sr.role_id = r.id 
    WHERE s.user_id = auth.uid() AND s.is_approved = true AND ((r.permissions ->> 'all'::text) = 'true'::text OR (r.permissions ->> 'manage_voters'::text) = 'true'::text))
);
CREATE POLICY "Admin manage voters insert" ON public.voters FOR INSERT TO public WITH CHECK (
    EXISTS ( SELECT 1 FROM staff s JOIN staff_roles sr ON s.id = sr.staff_id JOIN roles r ON sr.role_id = r.id 
    WHERE s.user_id = auth.uid() AND s.is_approved = true AND ((r.permissions ->> 'all'::text) = 'true'::text OR (r.permissions ->> 'manage_voters'::text) = 'true'::text))
);
CREATE POLICY "Approved staff can see all voter data" ON public.voters FOR SELECT TO public USING (
    EXISTS ( SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.is_approved = true )
);
CREATE POLICY "Manager staff can modify voter data" ON public.voters FOR ALL TO public 
USING (
    EXISTS ( SELECT 1 FROM staff s JOIN staff_roles sr ON s.id = sr.staff_id JOIN roles r ON sr.role_id = r.id 
    WHERE s.user_id = auth.uid() AND s.is_approved = true AND ((r.permissions ->> 'all'::text) = 'true'::text OR (r.permissions ->> 'manage_voters'::text) = 'true'::text OR (r.permissions ->> 'edit_voters'::text) = 'true'::text))
) 
WITH CHECK (
    EXISTS ( SELECT 1 FROM staff s JOIN staff_roles sr ON s.id = sr.staff_id JOIN roles r ON sr.role_id = r.id 
    WHERE s.user_id = auth.uid() AND s.is_approved = true AND ((r.permissions ->> 'all'::text) = 'true'::text OR (r.permissions ->> 'manage_voters'::text) = 'true'::text OR (r.permissions ->> 'edit_voters'::text) = 'true'::text))
);
CREATE POLICY "Staff select voters" ON public.voters FOR SELECT TO public USING (true);
CREATE POLICY "Staff update voters" ON public.voters FOR UPDATE TO public USING (true);

-- 8. VOTES
CREATE POLICY "Authorized staff manage votes" ON public.votes FOR ALL TO public USING (true);

-- 9. RE-NOTIFY
NOTIFY pgrst, 'reload schema';
