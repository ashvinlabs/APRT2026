-- Add column to track voting status
ALTER TABLE public.voters 
ADD COLUMN has_voted BOOLEAN DEFAULT FALSE,
ADD COLUMN voted_at TIMESTAMPTZ;

-- Table for voting audits (video recordings)
CREATE TABLE IF NOT EXISTS public.voting_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID REFERENCES public.voters(id) ON DELETE CASCADE,
    video_url TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for the new table
ALTER TABLE public.voting_audits ENABLE ROW LEVEL SECURITY;

-- Policy for voting audits: authenticated users can read (for audit) and insert (the terminal)
DROP POLICY IF EXISTS "Enable read for authenticated" ON public.voting_audits;
CREATE POLICY "Enable read for authenticated" ON public.voting_audits FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.voting_audits;
CREATE POLICY "Enable insert for authenticated" ON public.voting_audits FOR INSERT TO authenticated WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.voting_audits IS 'Stores references to video audit recordings for digital voting.';
