import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NFT } from '@/app/types/nft';
import { useNFTMarketplace } from '@/app/hooks/useNFTMarketplace';

interface TransferNFTModalProps {
    nft: NFT;
    isOpen: boolean;
    onClose: () => void;
}

export function TransferNFTModal({ nft, isOpen, onClose }: TransferNFTModalProps) {
    const [receiverAddress, setReceiverAddress] = useState<string>('');
    const { transferNFT, loading } = useNFTMarketplace();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!receiverAddress) {
            return;
        }

        await transferNFT(nft, receiverAddress);
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

                        <h2 className="text-2xl font-bold text-white mb-6 font-pixel">CHUYỂN NFT</h2>

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
                                <label className="block text-white mb-2 font-pixel">ĐỊA CHỈ NGƯỜI NHẬN</label>
                                <Input
                                    type="text"
                                    value={receiverAddress}
                                    onChange={(e) => setReceiverAddress(e.target.value)}
                                    placeholder="Địa chỉ ví Solana..."
                                    required
                                    className="bg-purple-950/20 border-purple-500 text-white placeholder:text-gray-500 font-pixel"
                                />
                                <p className="mt-2 text-xs text-gray-400 font-pixel">
                                    Nhập địa chỉ ví Solana hợp lệ (44 ký tự bắt đầu bằng số hoặc chữ cái)
                                </p>
                            </div>

                            <div className="mb-4 border border-yellow-500/30 bg-yellow-900/20 p-4">
                                <p className="text-yellow-400 text-sm font-pixel">
                                    <span className="font-bold">CẢNH BÁO:</span> Việc chuyển NFT là không thể đảo ngược. Hãy chắc chắn bạn đã nhập đúng địa chỉ người nhận.
                                </p>
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
                                    disabled={loading || !receiverAddress}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-none px-4 py-2 w-1/2 font-pixel disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "ĐANG XỬ LÝ..." : "CHUYỂN"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 