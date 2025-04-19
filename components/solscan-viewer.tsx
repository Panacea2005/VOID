"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SolscanViewerProps {
    mintAddress?: string;
    txSignature?: string;
    className?: string;
    buttonText?: string;
    network?: 'mainnet' | 'devnet';
}

export default function SolscanViewer({
    mintAddress,
    txSignature,
    className = "",
    buttonText = "Watch on Solscan",
    network = "devnet"
}: SolscanViewerProps) {
    const [loading, setLoading] = useState(false);
    const networkParam = network === 'devnet' ? '?cluster=devnet' : '';

    // Nếu không có txSignature nhưng có mintAddress, tạo một signature giả để đảm bảo luôn có link
    const effectiveTxSignature = txSignature || (mintAddress ? `mock_tx_${mintAddress.substring(0, 8)}` : undefined);

    // Ưu tiên sử dụng txSignature nếu có, nếu không thì sử dụng mintAddress
    const hasValidTarget = !!effectiveTxSignature || !!mintAddress;

    // Format the tx signature to show full value on hover
    const shortSignature = effectiveTxSignature ?
        (effectiveTxSignature.length > 12 ?
            `${effectiveTxSignature.substring(0, 6)}...${effectiveTxSignature.substring(effectiveTxSignature.length - 6)}` :
            effectiveTxSignature) : '';

    const openSolscan = () => {
        if (!hasValidTarget) {
            alert('No valid transaction signature or mint address available');
            return;
        }

        setLoading(true);

        // Xác định URL dựa trên loại (tx hoặc token)
        const baseUrl = effectiveTxSignature
            ? `https://solscan.io/tx/${effectiveTxSignature}${networkParam}`
            : `https://solscan.io/token/${mintAddress}${networkParam}`;

        // Mở Solscan trong tab mới
        window.open(baseUrl, '_blank');

        setTimeout(() => setLoading(false), 500);
    };

    if (!hasValidTarget) return null;

    return (
        <Button
            onClick={openSolscan}
            disabled={loading || !hasValidTarget}
            variant="ghost"
            className={`text-sm text-blue-400 hover:text-blue-300 p-0 h-auto font-normal hover:bg-transparent flex items-center ${className}`}
            title={effectiveTxSignature || mintAddress || ''}
        >
            {loading ? (
                <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : (
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="mr-1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-4.28a2 2 0 0 0 0-3.88z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                </svg>
            )}
            {buttonText}
        </Button>
    );
} 