import { supabase } from './supabase';
import { Permissions } from './permissions';

export type LogAction =
    | 'login'
    | 'logout'
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
    | 'add_candidate'
    | 'update_candidate'
    | 'delete_candidate'
    | 'upload_candidate_photo'
    | 'reorder_candidates'
    | 'approve_staff'
    | 'reject_staff'
    | 'delete_staff'
    | 'update_staff'
    | 'manage_roles'
    | 'export_data'
    | 'update_profile'
    | 'print_invitation'
    | 'bulk_print_invitations'
    | 'manual_cleanup';

export type LogGroup = keyof Permissions | 'system';

export async function logActivity(
    action: LogAction,
    group: LogGroup,
    metadata: any = {},
    voterId?: string
) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Ensure metadata includes a 'detail' string if we want specific descriptions
    const { error } = await supabase.from('audit_logs').insert({
        action,
        permission_group: group,
        metadata: {
            ...metadata,
            // If details are generated in the caller, they stay in metadata
        },
        staff_id: user.id,
        voter_id: voterId
    });

    if (error) {
        console.error('Failed to save audit log:', error);
    }
}
