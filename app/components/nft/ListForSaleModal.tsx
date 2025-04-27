import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NFT } from '../../types/nft';
import { useNFTMarketplace } from '../../hooks/useNFTMarketplace';

interface ListForSaleModalProps {
    nft: NFT;
    isOpen: boolean;
    onClose: () => void;
}

export function ListForSaleModal({ nft, isOpen, onClose }: ListForSaleModalProps) {
    const [price, setPrice] = useState<string>('');
    const { listNFTForSale, loading } = useNFTMarketplace();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!price || isNaN(Number(price)) || Number(price) <= 0) {
            return;
        }

        await listNFTForSale(nft, Number(price));
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
                        className="bg-black border-2 border-purple-500 p-8 max-w-md w-full relative"
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

                        <h2 className="text-2xl font-bold text-white mb-6 font-pixel">ĐĂNG NFT LÊN SÀN GIAO DỊCH</h2>

                        <div className="mb-6">
                            <div className="flex gap-4 items-center">
                                <div className="w-24 h-24 overflow-hidden relative border border-purple-500">
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
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block text-white mb-2 font-pixel">GIÁ (SOL)</label>
                                <Input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="Nhập giá bán..."
                                    step="0.01"
                                    min="0.001"
                                    required
                                    className="bg-purple-950/20 border-purple-500 text-white placeholder:text-gray-500 font-pixel"
                                />
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
                                    type="submit"
                                    disabled={loading || !price || isNaN(Number(price)) || Number(price) <= 0}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-none px-4 py-2 w-1/2 font-pixel disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG BÁN"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 