import VoterManagement from '@/components/VoterManagement';
import PermissionGuard from '@/components/PermissionGuard';

export default function VotersPage() {
    return (
        <PermissionGuard permission="view_voter_details">
            <main>
                <VoterManagement />
            </main>
        </PermissionGuard>
    );
}
