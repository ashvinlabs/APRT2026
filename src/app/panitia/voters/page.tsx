import VoterManagement from '@/components/VoterManagement';
import PermissionGuard from '@/components/PermissionGuard';

export default function VotersPage() {
    return (
        <main className="p-8">
            <VoterManagement />
        </main>
    );
}
