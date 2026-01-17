/**
 * Permission types for the APRT2026 application.
 * Values are boolean, where true means the permission is granted.
 */
export interface Permissions {
    all?: boolean;
    // System
    manage_settings?: boolean;
    view_logs?: boolean;
    manage_candidates?: boolean;
    // Team
    manage_staff?: boolean;
    manage_roles?: boolean;
    // Voters
    add_voters?: boolean;
    edit_voters?: boolean;
    delete_voters?: boolean;
    import_voters?: boolean;
    export_data?: boolean;
    view_voter_details?: boolean;
    manage_voters?: boolean; // Legacy/Catch-all
    // Operations
    check_in?: boolean;
    mark_presence?: boolean;
    uncheck_in?: boolean;
    print_invitation?: boolean;
    bulk_print_invitations?: boolean;
    // Voting
    manage_votes?: boolean;
    undo_vote?: boolean;
    view_dashboard?: boolean;
    manage_queue?: boolean;
}

export interface Role {
    id: string;
    name: string;
    permissions: Permissions;
    priority: number;
    color: string;
}

/**
 * Aggregates permissions from multiple roles.
 * If any role has 'all' set to true, all permissions are granted.
 * Otherwise, permissions are an OR of all role permissions.
 */
export function aggregatePermissions(roles: Role[]): Permissions {
    const aggregated: Permissions = {};

    for (const role of roles) {
        if (role.permissions.all) {
            return { all: true };
        }

        for (const [key, value] of Object.entries(role.permissions)) {
            if (value === true) {
                (aggregated as any)[key] = true;
            }
        }
    }

    return aggregated;
}

/**
 * Checks if the aggregated permissions allow a specific action.
 */
export function hasPermission(aggregated: Permissions, action: keyof Permissions): boolean {
    if (aggregated.all) return true;
    return !!aggregated[action];
}

/**
 * Constants for role names to avoid typos
 */
export const ROLES = {
    SUPER_ADMIN: 'Super Admin',
    ADMINISTRATOR: 'Administrator',
    SUPERVISOR: 'Supervisor',        // Replaces Controller
    TALLY_OFFICER: 'Tally Officer',  // New Role
    OFFICER: 'Officer',
};
