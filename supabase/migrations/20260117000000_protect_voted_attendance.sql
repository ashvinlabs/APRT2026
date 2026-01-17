-- Trigger function to prevent changing is_present to false if voter has already voted
CREATE OR REPLACE FUNCTION public.prevent_voted_attendance_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the voter has already voted
    IF OLD.status = 'voted' THEN
        -- If trying to set is_present to false
        IF NEW.is_present = false THEN
            RAISE EXCEPTION 'Cannot revoke attendance (is_present) for a voter who has already voted (status=voted). Data integrity protected.';
        END IF;
        
        -- Optional: Prevent changing status back from 'voted' to anything else?
        -- The user strictly said "mengubah kehadirannya jadi tidak hadir".
        -- But logically, one shouldn't be able to un-vote either easily.
        -- Let's stick to the specific request first, but maybe also prevent status regression.
        
        -- IF NEW.status != 'voted' THEN
        --    RAISE EXCEPTION 'Cannot change status of a voter who has already voted.';
        -- END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS check_voted_attendance_update ON public.voters;

CREATE TRIGGER check_voted_attendance_update
BEFORE UPDATE ON public.voters
FOR EACH ROW
EXECUTE FUNCTION public.prevent_voted_attendance_change();
