import InvitationGenerator from '@/components/InvitationGenerator';
import PermissionGuard from '@/components/PermissionGuard';

export default function InvitationsPage() {
    return (
        <PermissionGuard permission="manage_invitations">
            <main style={{ padding: '2rem 0' }}>
                <InvitationGenerator />
            </main>
        </PermissionGuard>
    );
}
