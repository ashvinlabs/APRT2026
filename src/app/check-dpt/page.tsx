import PublicVoterCheck from '@/components/PublicVoterCheck';
import PublicNavbar from '@/components/PublicNavbar';

export const metadata = {
    title: 'Cek DPT Online | APRT 2026',
    description: 'Verifikasi status pendaftaran Anda di DPT RT 12 Pelem Kidul.',
};

export default function CheckDPTPage() {
    return (
        <main className="min-h-screen bg-[#fcfcfc]">
            <PublicNavbar />
            <div className="pt-20">
                <PublicVoterCheck />
            </div>
        </main>
    );
}
