import TallyInterface from '@/components/TallyInterface';
import PermissionGuard from '@/components/PermissionGuard';

export default function TallyPage() {
    return (
        <PermissionGuard permission="manage_votes">
            <main style={{ padding: '2rem 0' }}>
                <TallyInterface />
            </main>
        </PermissionGuard>
    );
}
