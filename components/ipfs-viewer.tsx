"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface IPFSViewerProps {
    ipfsHash?: string;
    ipfsUrl?: string;
    buttonText?: string;
    className?: string;
}

export default function IPFSViewer({ ipfsHash, ipfsUrl, buttonText = "Watch on IPFS", className = "" }: IPFSViewerProps) {
    const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
    const [availableGateways, setAvailableGateways] = useState<string[]>([]);
    const [showGatewaySelector, setShowGatewaySelector] = useState(false);

    // Lấy ra các gateway từ localStorage nếu có, hoặc tạo mới từ hash
    useEffect(() => {
        if (!ipfsHash && !ipfsUrl) return;

        const hash = ipfsHash || (ipfsUrl?.startsWith('ipfs://') ? ipfsUrl.replace('ipfs://', '') : '');
        if (!hash) return;

        // Thử lấy danh sách gateway đã lưu
        try {
            const savedGateways = localStorage.getItem(`ipfs_gateways_${hash}`);
            if (savedGateways) {
                setAvailableGateways(JSON.parse(savedGateways));
                return;
            }
        } catch (e) {
            console.error("Error reading from localStorage:", e);
        }

        // Nếu không có gateway đã lưu, tạo danh sách mới
        const gatewayUrls = [
            `https://ipfs.filebase.io/ipfs/${hash}`,
            `https://nftstorage.link/ipfs/${hash}`,
            `https://cloudflare-ipfs.com/ipfs/${hash}`,
            `https://gateway.pinata.cloud/ipfs/${hash}`,
            `https://ipfs.io/ipfs/${hash}`,
            `https://dweb.link/ipfs/${hash}`
        ];
        setAvailableGateways(gatewayUrls);

        // Lưu lại vào localStorage để dùng sau
        try {
            localStorage.setItem(`ipfs_gateways_${hash}`, JSON.stringify(gatewayUrls));
        } catch (e) {
            console.error("Error writing to localStorage:", e);
        }
    }, [ipfsHash, ipfsUrl]);

    // Mở nội dung IPFS với gateway hiện tại
    const openIPFSContent = () => {
        if (availableGateways.length === 0) {
            alert("No IPFS gateway available");
            return;
        }

        // Mở cửa sổ mới với gateway hiện tại
        window.open(availableGateways[currentGatewayIndex], '_blank');
    };

    // Khi một gateway bị lỗi, chuyển sang gateway tiếp theo
    const handleGatewayError = () => {
        if (currentGatewayIndex < availableGateways.length - 1) {
            setCurrentGatewayIndex(currentGatewayIndex + 1);
        } else {
            // Đã thử tất cả gateway mà vẫn lỗi
            alert("Could not access content on any IPFS gateway. Please try again later.");
        }
    };

    // Chọn gateway cụ thể
    const selectGateway = (index: number) => {
        setCurrentGatewayIndex(index);
        setShowGatewaySelector(false);
    };

    if (!ipfsHash && (!ipfsUrl || !ipfsUrl.startsWith('ipfs://'))) {
        return null;
    }

    return (
        <div className={`relative ${className}`}>
            <Button
                onClick={openIPFSContent}
                variant="ghost"
                className="text-sm text-purple-400 hover:text-purple-300 p-0 h-auto font-normal hover:bg-transparent"
            >
                {buttonText}
            </Button>

            <Button
                onClick={() => setShowGatewaySelector(!showGatewaySelector)}
                variant="ghost"
                className="ml-1 text-xs text-gray-500 hover:text-gray-400 p-0 h-auto font-normal hover:bg-transparent"
                title="Change IPFS gateway"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                </svg>
            </Button>

            {showGatewaySelector && (
                <div className="absolute top-6 left-0 bg-black border border-purple-500 p-2 z-10 w-56">
                    <div className="text-xs text-white mb-2">Select IPFS Gateway:</div>
                    {availableGateways.map((gateway, index) => (
                        <button
                            key={index}
                            onClick={() => selectGateway(index)}
                            className={`block w-full text-xs text-left px-2 py-1 ${index === currentGatewayIndex
                                ? "bg-purple-900 text-white"
                                : "text-gray-400 hover:bg-purple-900/30"
                                }`}
                        >
                            {new URL(gateway).hostname}
                            {index === currentGatewayIndex && " (current)"}
                        </button>
                    ))}
                    <div className="border-t border-gray-700 mt-2 pt-2">
                        <button
                            onClick={handleGatewayError}
                            className="block w-full text-xs text-left px-2 py-1 text-orange-400 hover:bg-orange-900/30"
                        >
                            ↻ Try next gateway
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 