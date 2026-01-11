-- =============================================================
-- SEMI-DIGITAL TRANSITION: TOTAL NIK REMOVAL
-- =============================================================

-- 1. DROP NIK FROM VOTERS
ALTER TABLE public.voters DROP COLUMN IF EXISTS nik;

-- 2. RE-IMPLEMENT PUBLIC SEARCH (BY NAME & ADDRESS ONLY)
CREATE OR REPLACE FUNCTION public.search_voter_public(p_search TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    is_present BOOLEAN,
    has_voted BOOLEAN,
    voted_at TIMESTAMPTZ,
    invitation_code TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        -- Mask address details for privacy, only show enough to verify identity
        CASE 
            WHEN length(v.address) > 10 THEN left(v.address, 5) || '...'
            ELSE '[Alamat Dirahasiakan]'
        END as address,
        v.is_present,
        -- has_voted and voted_at might be used later or kept for legacy consistency
        FALSE as has_voted, 
        NULL::TIMESTAMPTZ as voted_at,
        CASE 
            WHEN v.invitation_code IS NOT NULL THEN '****'
            ELSE NULL
        END as invitation_code
    FROM public.voters v
    WHERE v.name ILIKE '%' || p_search || '%' OR v.address ILIKE '%' || p_search || '%'
    LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_voter_public(TEXT) TO anon, authenticated;

-- 3. NOTIFY POSTGREST
NOTIFY pgrst, 'reload schema';
