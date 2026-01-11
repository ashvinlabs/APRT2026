import { supabase } from './supabase';
import { Permissions } from './permissions';

export type LogAction =
    | 'check-in'
    | 'uncheck-in'
    | 'add_voter'
    | 'update_voter'
    | 'delete_voter'
    | 'import_voters'
    | 'sync_voters'
    | 'record_vote'
    | 'undo_vote'
    | 'update_settings'
    | 'approve_staff'
    | 'reject_staff'
    | 'manage_roles'
    | 'manage_candidates'
    | 'export_data'
    | 'update_profile';

export type LogGroup = keyof Permissions;

export async function logActivity(
    action: LogAction,
    group: LogGroup,
    metadata: any = {},
    voterId?: string
) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('audit_logs').insert({
        action,
        permission_group: group,
        metadata,
        staff_id: user.id,
        voter_id: voterId
    });

    if (error) {
        console.error('Failed to save audit log:', error);
    }
}
