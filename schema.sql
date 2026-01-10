-- APRT2026 Supabase Schema Migration

-- ==========================================
-- 1. TABLES CREATION
-- ==========================================

-- 1. Table for Panitia/Staff
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.1 Table for Roles (Discord-like)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '{}', -- e.g. {"manage_users": true, "manage_roles": true, ...}
    color TEXT DEFAULT '#94a3b8',
    priority INT DEFAULT 0, -- Higher number = higher precedence
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Junction Table for Staff Roles (Multi-role support)
CREATE TABLE IF NOT EXISTS public.staff_roles (
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (staff_id, role_id)
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

-- 6. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 2. REAL-TIME CONFIGURATION
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'votes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'voters'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.voters;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'staff'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'roles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.roles;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'staff_roles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_roles;
    END IF;
END $$;

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. POLICIES
-- ==========================================

-- Default Policies
DROP POLICY IF EXISTS "Enable read for everyone" ON public.roles;
CREATE POLICY "Enable read for everyone" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read for everyone" ON public.staff_roles;
CREATE POLICY "Enable read for everyone" ON public.staff_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read for everyone" ON public.staff;
CREATE POLICY "Enable read for everyone" ON public.staff FOR SELECT USING (true);

-- Allow authenticated users to manage data based on roles
DROP POLICY IF EXISTS "Authorized staff manage voters" ON public.voters;
CREATE POLICY "Authorized staff manage voters" ON public.voters FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read for everyone" ON public.voters;
CREATE POLICY "Enable read for everyone" ON public.voters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authorized staff manage votes" ON public.votes;
CREATE POLICY "Authorized staff manage votes" ON public.votes FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable write for authenticated" ON public.audit_logs;
CREATE POLICY "Enable write for authenticated" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read for everyone" ON public.candidates;
CREATE POLICY "Enable read for everyone" ON public.candidates FOR SELECT USING (true);

-- Settings Policies
DROP POLICY IF EXISTS "Enable read for everyone" ON public.settings;
CREATE POLICY "Enable read for everyone" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.settings;
CREATE POLICY "Enable all for authenticated users" ON public.settings FOR ALL TO authenticated USING (true);

-- ==========================================
-- 5. SEED DATA
-- ==========================================

-- Seed initial roles
INSERT INTO public.roles (name, permissions, color, priority) VALUES 
('Super Admin', '{"all": true}', '#ef4444', 100),
('Administrator', '{"manage_voters": true, "manage_votes": true, "manage_settings": true, "view_logs": true}', '#f59e0b', 80),
('Controller', '{"manage_voters": true, "manage_votes": true, "manage_invitations": true}', '#3b82f6', 60),
('Officer', '{"check_in": true, "mark_presence": true}', '#10b981', 40)
ON CONFLICT (name) DO NOTHING;

-- Seed initial settings
INSERT INTO public.settings (id, value) 
VALUES 
    ('election_config', '{"title": "Pemilihan Ketua RT 12", "location": "Pelem Kidul - Baturetno", "is_voting_open": true, "is_registration_open": true, "date": "2026-01-10"}')
ON CONFLICT (id) DO NOTHING;
