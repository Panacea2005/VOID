"use client";

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { AuthProvider } from '@/contexts/AuthContext';

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
            {/* Restore Supabase providers */}
            <SupabaseProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </SupabaseProvider>
        </WalletContextProvider>
    );
}