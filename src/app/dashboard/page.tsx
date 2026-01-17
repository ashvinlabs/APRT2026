'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LiveDashboard from '@/components/LiveDashboard';
import VotingQueueDisplay from '@/components/VotingQueueDisplay';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const [viewMode, setViewMode] = useState<'queue' | 'tally' | 'loading'>('loading');

    useEffect(() => {
        // Initial fetch
        checkConfig();

        // Realtime subscription for settings changes
        const channel = supabase
            .channel('dashboard_settings')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'settings',
                    filter: 'id=eq.election_config'
                },
                (payload) => {
                    const newConfig = payload.new as any;
                    determineViewMode(newConfig.value);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function checkConfig() {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('id', 'election_config')
            .single();

        if (data) {
            determineViewMode(data.value);
        } else {
            setViewMode('queue'); // Default fallback
        }
    }

    function determineViewMode(config: any) {
        // Priority Logic:
        // 1. If Registration is OPEN (regardless of Voting status, usually), show Queue.
        //    (User: "gunakan dashboard untuk menampilkan antrian ... ketika pendaftaran di buka")
        // 2. If Registration is CLOSED and Voting is OPEN (Tally phase), show Tally.
        //    (User: "ketika voting dibuka, dan pendaftaran ditutup gunakan untuk menampilkan hasil perhitungan")

        if (config.is_registration_open) {
            setViewMode('queue');
        } else if (config.is_voting_open) {
            setViewMode('tally');
        } else {
            // If both closed? Default to Queue/Waiting or Tally?
            // "Voting hanya bisa di buka ketika pendaftaran sudah di tutup"
            // If both closed, likely post-election or pre-election. 
            // Let's default to Queue if we treat it as "Waiting to Start".
            setViewMode('queue');
        }
    }

    if (viewMode === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#fcfcfc]">
            {viewMode === 'queue' ? (
                <VotingQueueDisplay />
            ) : (
                <LiveDashboard />
            )}
        </main>
    );
}
