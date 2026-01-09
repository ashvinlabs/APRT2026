-- APRT 2026 - Migration & Dummy Data Seeding
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Add NIK column to voters table (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='nik') THEN
        ALTER TABLE public.voters ADD COLUMN nik TEXT;
    END IF;
END $$;

-- 2. Add voter_id to audit_logs table (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='voter_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN voter_id UUID REFERENCES public.voters(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Clear existing dummy voters to avoid conflicts (Optional, but recommended for clean seed)
-- DELETE FROM public.voters WHERE invitation_code LIKE 'A%' OR invitation_code LIKE 'B%' OR invitation_code LIKE 'RT12-%';

-- 4. INSERT Dummy Voter Data
INSERT INTO public.voters (name, nik, address, invitation_code)
VALUES 
  ('Ahmad Santoso', '3404120101700001', 'Jl. Pelem Kidul No. 12', 'A001'),
  ('Siti Aminah', '3404124205800002', 'Jl. Pelem Kidul No. 12', 'A002'),
  ('Budi Darmawan', '3404121503850003', 'Jl. Pelem Kidul No. 45', 'B001'),
  ('Dewi Sartika', '3404125208920004', 'Jl. Pelem Kidul No. 45', 'B002'),
  ('Eko Prasetyo', '3404122012750005', 'Jl. Pelem Kidul No. 67', 'C001'),
  ('Rina Wijaya', '3404126107880006', 'Jl. Pelem Kidul No. 67', 'C002'),
  ('Joko Widodo', '3404121010600007', 'Jl. Pelem Kidul No. 89', 'D001'),
  ('Iriana', '3404125205650008', 'Jl. Pelem Kidul No. 89', 'D002'),
  ('Agus Setiawan', '3404121708820009', 'blok A-12', 'E001'),
  ('Maya Indah', '3404125901900010', 'blok A-12', 'E002'),
  ('Tono Arianto', '3404123004720011', 'blok B-05', 'F001'),
  ('Lani Suryani', '3404127005740012', 'blok B-05', 'F002'),
  ('Heri Kurniawan', '3404121212880013', 'blok C-01', 'G001'),
  ('Nina Marlina', '3404125505920014', 'blok C-01', 'G002'),
  ('Dani Ramdani', '3404120808800015', 'RT 12 / RW 01', 'H001')
ON CONFLICT (invitation_code) DO NOTHING;
