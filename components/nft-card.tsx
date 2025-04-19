"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import IPFSViewer from '@/components/ipfs-viewer';
import SolscanViewer from '@/components/solscan-viewer';

interface NFTCardProps {
    nft: {
        id: string;
        name: string;
        description: string;
        image: string;
        fallbackImages?: string[];
        ipfsHash?: string;
        ipfsUrl?: string;
        mintAddress?: string;
        txSignature?: string;
        mintedAt: string;
        model3d?: string;
        model3dHash?: string;
        type?: string;
        attributes?: Array<{ trait_type: string; value: string }>;
    };
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onViewModelClick?: (nft: any) => void;
}

export default function NFTCard({ nft, onMouseEnter, onMouseLeave, onViewModelClick }: NFTCardProps) {
    const [imageError, setImageError] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleImageError = () => {
        // Nếu hình ảnh không tải được, thử sử dụng fallbackImages
        if (nft.fallbackImages && nft.fallbackImages.length > currentImageIndex) {
            setCurrentImageIndex(currentImageIndex + 1);
        } else {
            // Nếu hết fallback, đặt cờ lỗi
            setImageError(true);
        }
    };

    // Xác định hình ảnh hiển thị
    const displayImage = imageError
        ? '/placeholder.jpg'
        : nft.fallbackImages && nft.fallbackImages.length > currentImageIndex
            ? nft.fallbackImages[currentImageIndex]
            : nft.image;

    // Xác định loại NFT để hiển thị biểu tượng phù hợp
    const nftType = nft.type || 'unknown';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-black border border-purple-900/50 overflow-hidden group hover:border-purple-500 transition-colors duration-300"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="aspect-square overflow-hidden relative">
                <img
                    src={displayImage}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="lazy"
                />

                {/* Hiệu ứng gradient */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-1/3"></div>

                {/* Badge loại NFT */}
                <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded-sm text-xs font-pixel">
                    {nftType === 'music' && <span className="text-pink-400">MUSIC</span>}
                    {nftType !== 'music' && <span className="text-purple-400">CUBE</span>}
                </div>
            </div>

            <div className="p-4">
                <h3 className="text-xl font-bold text-white mb-1 font-pixel">{nft.name}</h3>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{nft.description}</p>

                {/* Display attributes if available */}
                {nft.attributes && nft.attributes.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                        {nft.attributes.map((attr, index) => (
                            <div key={index} className="bg-purple-900/30 px-2 py-1 text-xs text-purple-300 rounded">
                                {attr.trait_type === 'Type'
                                    ? attr.value
                                    : `${attr.trait_type}: ${attr.value}`}
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                        <IPFSViewer
                            ipfsHash={nft.ipfsHash || ''}
                            ipfsUrl={nft.ipfsUrl}
                        />
                        <span className="text-xs text-gray-500">
                            {new Date(nft.mintedAt).toLocaleDateString()}
                        </span>
                    </div>

                    {/* 3D Model viewer button */}
                    {(nft.model3d || nft.model3dHash) && (
                        <button
                            className="text-sm text-purple-400 hover:text-purple-300 flex items-center"
                            onClick={() => onViewModelClick?.(nft)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-1"
                            >
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                <path d="M12 16a4 4 0 100-8 4 4 0 000 8z" />
                            </svg>
                            Watch Model 3D
                        </button>
                    )}

                    {/* Solscan link */}
                    <SolscanViewer
                        mintAddress={nft.mintAddress}
                        txSignature={nft.txSignature}
                        network={process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'mainnet' | 'devnet' || 'devnet'}
                    />
                </div>
            </div>
        </motion.div>
    );
} 