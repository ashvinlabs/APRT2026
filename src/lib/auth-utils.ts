import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { aggregatePermissions, Role, Permissions } from './permissions';

export interface UserProfile {
    id: string;
    user_id: string;
    name: string;
    email: string;
    is_approved: boolean;
    photo_url?: string;
    roles: Role[];
    permissions: Permissions;
}

export async function getUserProfile(supabase: any, userId: string): Promise<UserProfile | null> {
    // Fetch staff profile
    const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (staffError || !staff) return null;

    // Fetch roles
    const { data: roles, error: rolesError } = await supabase
        .from('staff_roles')
        .select(`
            role:roles (
                id,
                name,
                permissions,
                priority,
                color
            )
        `)
        .eq('staff_id', staff.id);

    const mappedRoles: Role[] = roles?.map((r: any) => r.role) || [];
    const permissions = aggregatePermissions(mappedRoles);

    return {
        ...staff,
        roles: mappedRoles,
        permissions
    };
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return getUserProfile(supabase, user.id);
}
