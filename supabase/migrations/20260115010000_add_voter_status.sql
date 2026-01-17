-- Add status column to voters table to track queue flow
-- Values: 'registered', 'checked_in', 'called', 'voted'

ALTER TABLE public.voters 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'registered';

-- Migrate existing data
UPDATE public.voters 
SET status = 'checked_in' 
WHERE is_present = true AND status = 'registered';

-- Add index for performance on queue queries
CREATE INDEX IF NOT EXISTS voters_status_idx ON public.voters(status);

-- Add call_timestamp to track when a voter was called (for sorting 'called' list or timeouts)
ALTER TABLE public.voters
ADD COLUMN IF NOT EXISTS called_at timestamp with time zone;
