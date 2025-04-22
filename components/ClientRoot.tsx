"use client";

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AudioProvider } from '../app/game/contexts/audio-context';

// Dynamically import WalletContextProvider to avoid SSR issues
const WalletContextProvider = dynamic(
    () => import('@/components/WalletContextProvider'),
    { ssr: false }
);

interface ClientRootProps {
    children: ReactNode;
}

export default function ClientRoot({ children }: ClientRootProps) {
    return (
        <WalletContextProvider>
            {/* Add AudioProvider after WalletContextProvider but before other providers */}
            <AudioProvider>
                {/* Restore Supabase providers */}
                <SupabaseProvider>
                    <AuthProvider>
                        {/* Note: We're NOT adding AudioWrapper here since it's already rendered in void-hub.tsx */}
                        {children}
                    </AuthProvider>
                </SupabaseProvider>
            </AudioProvider>
        </WalletContextProvider>
    );
}