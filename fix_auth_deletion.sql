-- ==========================================
-- AUTO-DELETE AUTH USER ON STAFF REMOVAL
-- ==========================================
-- This script ensures that when a record is deleted from 'public.staff',
-- the corresponding account in 'auth.users' is also automatically deleted.
-- This allows the same email to be used for re-registration if needed.

-- 1. Create the function with SECURITY DEFINER to bypass RLS/Auth restrictions
CREATE OR REPLACE FUNCTION public.handle_delete_staff_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the user from auth.users based on the user_id
  DELETE FROM auth.users WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on public.staff
DROP TRIGGER IF EXISTS on_staff_deleted ON public.staff;
CREATE TRIGGER on_staff_deleted
  AFTER DELETE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_delete_staff_auth();

-- ==========================================
-- VERIFICATION (Optional)
-- ==========================================
-- After running this, if you delete a staff member from the UI,
-- their account in the "Authentication" tab should also disappear.
