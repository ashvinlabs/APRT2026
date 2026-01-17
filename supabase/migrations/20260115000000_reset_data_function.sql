-- Create a function to reset election data
-- This function:
-- 1. Checks if the executing user is a Super Admin
-- 2. Deletes all votes
-- 3. Resets all voters' attendance status
-- 4. Deletes all audit logs
-- 5. Inserts a new audit log entry recording the reset

CREATE OR REPLACE FUNCTION reset_election_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  -- Get the staff_id of the current user
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE user_id = auth.uid();

  -- Check if user is Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.staff_roles sr
    JOIN public.roles r ON sr.role_id = r.id
    WHERE sr.staff_id = v_staff_id AND r.name = 'Super Admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only Super Admins can reset election data.';
  END IF;

  -- 1. Clear Votes
  TRUNCATE TABLE public.votes;

  -- 2. Reset Voters Attendance
  UPDATE public.voters 
  SET is_present = false, 
      present_at = NULL, 
      handled_by = NULL;

  -- 3. Clear Audit Logs
  TRUNCATE TABLE public.audit_logs;
  
  -- 4. Log the reset action (This will be the only log entry after reset)
  INSERT INTO public.audit_logs (action, permission_group, staff_id, metadata)
  VALUES (
    'reset_election_data', 
    'system', 
    v_staff_id, 
    '{"detail": "Election data reset (votes, logs, voter presence) cleared"}'::jsonb
  );

END;
$$;

-- Grant execution permission to authenticated users (logic inside handles authorization)
GRANT EXECUTE ON FUNCTION reset_election_data() TO authenticated;
