import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { NFT } from '../../types/nft';
import { useNFTMarketplace } from '../../hooks/useNFTMarketplace';

interface BurnNFTModalProps {
    nft: NFT;
    isOpen: boolean;
    onClose: () => void;
}

export function BurnNFTModal({ nft, isOpen, onClose }: BurnNFTModalProps) {
    const [confirmation, setConfirmation] = useState<boolean>(false);
    const { burnNFT, loading } = useNFTMarketplace();

    const handleBurn = async () => {
        if (!confirmation) {
            return;
        }

        await burnNFT(nft);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="bg-black border-2 border-red-500 p-8 max-w-md w-full relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <motion.button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white hover:text-pink-500 transition-colors"
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.button>

                        <div className="text-center mb-6">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 0.5, repeat: 3 }}
                                className="inline-block"
                            >
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-500 mx-auto">
                                    <path d="M12 9V14M12 19C7.58172 19 4 15.4183 4 11C4 6.58172 7.58172 3 12 3C16.4183 3 20 6.58172 20 11C20 15.4183 16.4183 19 12 19ZM12 17H12.01V17.01H12V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </motion.div>
                            <h2 className="text-2xl font-bold text-red-400 mb-2 font-pixel">ĐỐT NFT</h2>
                            <p className="text-gray-300 text-sm font-pixel">
                                Đây là một hành động không thể đảo ngược. NFT của bạn sẽ bị xóa vĩnh viễn.
                            </p>
                        </div>

                        <div className="mb-6">
                            <div className="flex gap-4 items-center border border-red-500/30 bg-red-900/10 p-4">
                                <div className="w-24 h-24 overflow-hidden relative border border-red-500">
                                    <div
                                        className={`w-full h-full ${nft.color === "purple" ? "text-purple-500/70" :
                                            nft.color === "pink" ? "text-pink-500/70" : "text-blue-500/70"
                                            }`}
                                    >
                                        {/* Đây là nơi hiển thị hình ảnh NFT */}
                                        <div className="flex items-center justify-center w-full h-full text-3xl font-bold">
                                            {nft.type === 'cube' ? '◼' : nft.type === 'music' ? '♪' : '◆'}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white font-pixel">{nft.name}</h3>
                                    <p className="text-gray-400 text-sm font-pixel">Loại: {nft.type.toUpperCase()}</p>
                                    <motion.div
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="mt-2"
                                    >
                                        <p className="text-red-400 text-xs font-pixel">SẼ BỊ XÓA VĨNH VIỄN</p>
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 border border-red-500/30 bg-red-900/10 p-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={confirmation}
                                    onChange={(e) => setConfirmation(e.target.checked)}
                                    className="h-4 w-4 text-red-500 rounded focus:ring-red-500 focus:ring-opacity-25"
                                />
                                <span className="text-white text-sm font-pixel">
                                    Tôi hiểu rằng hành động này không thể đảo ngược và NFT sẽ bị xóa vĩnh viễn
                                </span>
                            </label>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="outline"
                                className="bg-transparent border-2 border-white/30 hover:bg-white/10 text-white rounded-none px-4 py-2 w-1/2 font-pixel"
                            >
                                HỦY
                            </Button>
                            <Button
                                type="button"
                                onClick={handleBurn}
                                disabled={loading || !confirmation}
                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-none px-4 py-2 w-1/2 font-pixel disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "ĐANG XỬ LÝ..." : "ĐỐT NFT"}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 