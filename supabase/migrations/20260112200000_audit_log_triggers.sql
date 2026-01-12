-- Migration: Audit Log Triggers (Layer 2)
-- Date: 2026-01-12 20:00:00
-- Description: Implements a generic trigger function to log all INSERT/UPDATE/DELETE actions on critical tables.

-- 1. Create the generic trigger function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_action TEXT;
  v_metadata JSONB;
  v_voter_id UUID := NULL;
  v_permission_group TEXT;
BEGIN
  -- Attempt to get the current user ID. 
  -- In some edge cases (e.g. Supabase Dashboard operations) this might be null, 
  -- but for app usage it should be auth.uid()
  v_user_id := auth.uid();
  
  -- Set Action String (e.g., 'DB_INSERT') to distinguish from App-level logs
  v_action := 'DB_' || TG_OP; 
  
  -- Determine Permission Group based on table
  IF TG_TABLE_NAME = 'voters' THEN 
    v_permission_group := 'voter_management';
    IF TG_OP = 'DELETE' THEN v_voter_id := OLD.id; ELSE v_voter_id := NEW.id; END IF;
  ELSIF TG_TABLE_NAME = 'votes' THEN 
    v_permission_group := 'manage_votes';
  ELSIF TG_TABLE_NAME = 'settings' THEN 
    v_permission_group := 'manage_settings';
  ELSIF TG_TABLE_NAME = 'staff' THEN 
    v_permission_group := 'manage_staff';
  ELSIF TG_TABLE_NAME = 'roles' THEN 
    v_permission_group := 'manage_roles';
  ELSIF TG_TABLE_NAME = 'candidates' THEN 
    v_permission_group := 'manage_candidates';
  ELSE 
    v_permission_group := 'system';
  END IF;

  -- Build Metadata (Diff)
  IF TG_OP = 'INSERT' THEN
    v_metadata := jsonb_build_object('table', TG_TABLE_NAME, 'new', row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    v_metadata := jsonb_build_object('table', TG_TABLE_NAME, 'old', row_to_json(OLD), 'new', row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_metadata := jsonb_build_object('table', TG_TABLE_NAME, 'old', row_to_json(OLD));
  END IF;

  -- Insert into audit_logs
  -- We use SECURITY DEFINER to ensure this ensures privileges to write to audit_logs
  INSERT INTO public.audit_logs (staff_id, action, permission_group, metadata, voter_id)
  VALUES (v_user_id, v_action, v_permission_group, v_metadata, v_voter_id);
  
  RETURN NULL; -- Result is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply Triggers to Critical Tables

-- Voters
DROP TRIGGER IF EXISTS audit_log_voters ON public.voters;
CREATE TRIGGER audit_log_voters
AFTER INSERT OR UPDATE OR DELETE ON public.voters
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Votes
DROP TRIGGER IF EXISTS audit_log_votes ON public.votes;
CREATE TRIGGER audit_log_votes
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Settings
DROP TRIGGER IF EXISTS audit_log_settings ON public.settings;
CREATE TRIGGER audit_log_settings
AFTER INSERT OR UPDATE OR DELETE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Staff
DROP TRIGGER IF EXISTS audit_log_staff ON public.staff;
CREATE TRIGGER audit_log_staff
AFTER INSERT OR UPDATE OR DELETE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Roles
DROP TRIGGER IF EXISTS audit_log_roles ON public.roles;
CREATE TRIGGER audit_log_roles
AFTER INSERT OR UPDATE OR DELETE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Candidates
DROP TRIGGER IF EXISTS audit_log_candidates ON public.candidates;
CREATE TRIGGER audit_log_candidates
AFTER INSERT OR UPDATE OR DELETE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
