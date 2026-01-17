-- Add supporting columns for advanced queue logic

ALTER TABLE public.voters 
ADD COLUMN IF NOT EXISTS queue_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS skip_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS gender text; -- 'L' for Male, 'P' for Female

-- Initialize queue_timestamp for existing checked_in voters if any (preserve FIFO based on present_at)
UPDATE public.voters 
SET queue_timestamp = present_at 
WHERE status = 'checked_in' AND queue_timestamp IS NULL;

-- Create index for faster queue ordering
CREATE INDEX IF NOT EXISTS voters_queue_order_idx ON public.voters(status, queue_timestamp);
