"use client";

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Import WalletContextProvider một cách động để tránh lỗi SSR
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
            {children}
        </WalletContextProvider>
    );
} 