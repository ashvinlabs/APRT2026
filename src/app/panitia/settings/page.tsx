import SettingsManager from '@/components/SettingsManager';
import PermissionGuard from '@/components/PermissionGuard';

export default function SettingsPage() {
    return (
        <PermissionGuard permission="manage_settings">
            <SettingsManager />
        </PermissionGuard>
    );
}
