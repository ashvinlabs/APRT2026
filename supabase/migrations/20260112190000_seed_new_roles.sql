-- Migration: Seed New Roles structure (5-Role System)
-- Date: 2026-01-12 19:00:00

DO $$ 
DECLARE
    supervisor_id UUID;
    controller_id UUID;
BEGIN
    -- 1. Ensure 'Supervisor' exists
    INSERT INTO public.roles (name, permissions, color, priority)
    VALUES ('Supervisor', '{}', '#3b82f6', 60)
    ON CONFLICT (name) DO NOTHING;

    -- Get ID of Supervisor
    SELECT id INTO supervisor_id FROM public.roles WHERE name = 'Supervisor';

    -- Check if 'Controller' exists
    SELECT id INTO controller_id FROM public.roles WHERE name = 'Controller';

    -- 2. If 'Controller' exists, migrate staff and delete it
    IF controller_id IS NOT NULL THEN
        -- Move all staff from Controller to Supervisor
        -- Check for conflicts in staff_roles (if staff already has supervisor role)
        -- We insert ignore or similar logic. 
        -- Simpler: Update role_id where conflict doesn't exist
        
        -- A. Update assignments where the staff doesn't already have 'Supervisor' role
        UPDATE public.staff_roles sr
        SET role_id = supervisor_id
        WHERE sr.role_id = controller_id
        AND NOT EXISTS (
            SELECT 1 FROM public.staff_roles sr2 
            WHERE sr2.staff_id = sr.staff_id 
            AND sr2.role_id = supervisor_id
        );

        -- B. If any remaining staff_roles point to Controller (meaning they had both), just delete them
        DELETE FROM public.staff_roles WHERE role_id = controller_id;

        -- C. Now safely delete the Controller role
        DELETE FROM public.roles WHERE id = controller_id;
    END IF;

END $$;

-- 3. Insert 'Tally Officer'
INSERT INTO public.roles (name, permissions, color, priority)
VALUES ('Tally Officer', '{}', '#8b5cf6', 50)
ON CONFLICT (name) DO NOTHING;

-- 4. Update Permissions for All Roles to match Documentation Matrix

-- Super Admin
UPDATE public.roles SET 
    permissions = '{"all": true}',
    color = '#ef4444', 
    priority = 100
WHERE name = 'Super Admin';

-- Administrator
UPDATE public.roles SET 
    permissions = '{
        "manage_settings": true, 
        "manage_staff": true, 
        "manage_roles": true, 
        "view_logs": true, 
        "manage_invitations": true, 
        "manage_voters": true, 
        "manage_votes": true, 
        "undo_vote": true, 
        "check_in": true, 
        "view_dashboard": true
    }',
    color = '#f59e0b',
    priority = 80
WHERE name = 'Administrator';

-- Supervisor (ex-Controller)
UPDATE public.roles SET 
    permissions = '{
        "view_logs": true, 
        "manage_invitations": true, 
        "manage_voters": true, 
        "manage_votes": true, 
        "undo_vote": true, 
        "check_in": true, 
        "view_dashboard": true
    }',
    color = '#3b82f6',
    priority = 60
WHERE name = 'Supervisor';

-- Tally Officer
UPDATE public.roles SET 
    permissions = '{
        "manage_votes": true, 
        "undo_vote": true, 
        "view_dashboard": true
    }',
    color = '#8b5cf6',
    priority = 50
WHERE name = 'Tally Officer';

-- Officer
UPDATE public.roles SET 
    permissions = '{
        "check_in": true, 
        "view_dashboard": true
    }',
    color = '#10b981',
    priority = 40
WHERE name = 'Officer';
