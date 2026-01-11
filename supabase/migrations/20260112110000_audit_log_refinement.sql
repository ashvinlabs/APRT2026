-- Add permission_group to audit_logs for better categorization
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS permission_group TEXT;

-- Update existing logs with logical groups
UPDATE public.audit_logs SET permission_group = 'voter_management' WHERE action IN ('check-in', 'uncheck-in');

-- Ensure audit logging is enforced for sensitive tables
-- votes, staff, roles, settings, candidates are already covered if we add app-level logging,
-- but adding the column is the first step.
