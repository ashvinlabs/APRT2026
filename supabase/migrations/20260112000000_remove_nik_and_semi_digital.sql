-- Migration: remove_nik_and_semi_digital
-- Description: Removes NIK column and updates public search for Semi-Digital workflow.
-- Created at: 2026-01-12

-- 1. Update the public search function for Semi-Digital (Name/Address only)
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
        -- Mask address details for privacy
        CASE 
            WHEN length(v.address) > 10 THEN left(v.address, 5) || '...'
            ELSE '[Alamat Dirahasiakan]'
        END as address,
        v.is_present,
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

-- 2. Drop the NIK column (DPT Privacy)
-- CAUTION: This is irreversible.
ALTER TABLE public.voters DROP COLUMN IF EXISTS nik;
