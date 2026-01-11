-- 1. Create a unique constraint for Name + Address
-- This ensures that "Same Name, Different Address" is allowed, 
-- but "Same Name, Same Address" is blocked as a duplicate.

ALTER TABLE public.voters 
ADD CONSTRAINT voters_name_address_unique UNIQUE (name, address);

-- 2. Update search function to ensure it reflects this composite identity
-- (Already updated in previous migration, but good to keep in mind)
