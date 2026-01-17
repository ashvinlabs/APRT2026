import VotingQueueController from '@/components/VotingQueueController';
import PermissionGuard from '@/components/PermissionGuard';

export const metadata = {
    title: 'Manajemen Antrian | APRT 2026',
    description: 'Kontrol panggilan antrian pemilih',
};

export default function QueueControllerPage() {
    return (
        <PermissionGuard permission="manage_queue">
            <VotingQueueController />
        </PermissionGuard>
    );
}
