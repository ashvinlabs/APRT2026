-- APRT2026 Supabase Schema Migration

-- 1. Table for Panitia/Staff
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'operator', -- operator, admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table for Candidates
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    photo_url TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table for Voters
CREATE TABLE IF NOT EXISTS public.voters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nik TEXT, -- National Identity Number
    address TEXT,
    invitation_code TEXT UNIQUE,
    is_present BOOLEAN DEFAULT FALSE,
    present_at TIMESTAMPTZ,
    handled_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table for Votes (The actual ballot)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidates(id),
    is_valid BOOLEAN DEFAULT TRUE,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Audit Logs for Transparency
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    staff_id UUID REFERENCES auth.users(id),
    voter_id UUID REFERENCES public.voters(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB
);

-- Enable Real-time for votes and voters
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.voters;

-- RLS (Row Level Security) - Basic Setup
-- For a local/internal election project, we might keep it simple or restricted to authenticated users.
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (Staff) to read/write during the election
CREATE POLICY "Enable all for authenticated users" ON public.voters FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.votes FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable write for authenticated users" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable read for authenticated users" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read for everyone" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Enable insert for testing" ON public.candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for testing" ON public.candidates FOR UPDATE USING (true);
CREATE POLICY "Enable delete for testing" ON public.candidates FOR DELETE USING (true);

-- --- SUPABASE STORAGE POLICIES --- --
-- 1. Pastikan Anda membuat bucket bernama 'candidates' di Dashboard Supabase (Storage menu)
-- 2. Atur bucket menjadi 'Public'

-- Jalankan SQL di bawah ini untuk mengizinkan upload tanpa login (untuk testing):
CREATE POLICY "Allow Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'candidates');
CREATE POLICY "Allow Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'candidates');
CREATE POLICY "Allow Public Select" ON storage.objects FOR SELECT USING (bucket_id = 'candidates');
CREATE POLICY "Allow Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'candidates');
