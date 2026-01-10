import VoterManagement from '@/components/VoterManagement';
import PermissionGuard from '@/components/PermissionGuard';

export default function VotersPage() {
    return (
        <PermissionGuard permission="mark_presence">
            <main style={{ padding: '2rem 0' }}>
                <VoterManagement />
            </main>
        </PermissionGuard>
    );
}
