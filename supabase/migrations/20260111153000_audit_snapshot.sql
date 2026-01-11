-- Add snapshot_url to voting_audits table
ALTER TABLE public.voting_audits 
ADD COLUMN snapshot_url TEXT;

-- Add comment
COMMENT ON COLUMN public.voting_audits.snapshot_url IS 'URL of the snapshot image taken when the voter scanned their invitation.';
