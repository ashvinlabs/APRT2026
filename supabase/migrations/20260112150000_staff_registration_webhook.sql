-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a webhook to notify admins on new staff registration
-- Note: Replace 'pemilurt12.ashvinlabs.com' with the actual project domain or function URL
-- In production, the URL will be: https://[PROJECT_ID].supabase.co/functions/v1/notify-admin-registration

-- Since the function URL is dynamic, we typically set this up via the Supabase Dashboard.
-- However, we can provide the SQL structure for completeness using a Generic Hook if using Custom Webhooks.

/* 
-- Example of manual webhook registration if supported by project structure:
-- This is often better handled via Supabase Dashboard > Webhooks for easier management.
*/

-- Add a comment to audit log for the new implementation
INSERT INTO public.audit_logs (action, permission_group, metadata)
VALUES ('setup_registration_webhook', 'system', '{"status": "Edge Function notify-admin-registration created"}');
