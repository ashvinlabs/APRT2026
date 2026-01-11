/**
 * Permission types for the APRT2026 application.
 * Values are boolean, where true means the permission is granted.
 */
export interface Permissions {
    all?: boolean;
    manage_staff?: boolean;
    manage_roles?: boolean; // Role management
    manage_voters?: boolean;
    edit_voters?: boolean;
    manage_votes?: boolean;
    undo_vote?: boolean;
    view_logs?: boolean;
    manage_settings?: boolean;
    manage_candidates?: boolean;
    manage_invitations?: boolean;
    check_in?: boolean;
    mark_presence?: boolean;
    access_voting_terminal?: boolean;
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
    CONTROLLER: 'Controller',
    OFFICER: 'Officer',
};
