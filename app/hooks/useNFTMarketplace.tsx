import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { NFTMarketplaceClient } from '../utils/nft-marketplace';
import { NFT, NFTType } from '../types/nft';
import { toast } from 'sonner';

export const useNFTMarketplace = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [loading, setLoading] = useState(false);
    const [ownedNFTs, setOwnedNFTs] = useState<NFT[]>([]);
    const [listedNFTs, setListedNFTs] = useState<NFT[]>([]);
    const [marketNFTs, setMarketNFTs] = useState<NFT[]>([]);

    const marketplaceClient = new NFTMarketplaceClient(connection);

    // Giả lập lấy dữ liệu NFT từ backend (trong thực tế sẽ cần thay thế)
    const mockFetchNFTData = async (mint: PublicKey): Promise<Partial<NFT>> => {
        // Trong ứng dụng thực tế, bạn sẽ gọi API để lấy metadata của NFT
        // Giả lập response với dữ liệu ngẫu nhiên
        const mockTypes: NFTType[] = ['cube', 'music', 'other'];
        const mockColors: ("purple" | "pink" | "blue")[] = ['purple', 'pink', 'blue'];
        const mockShapes = ['complex', 'wave', 'grid', 'dots', 'noise'];

        return {
            id: Math.floor(Math.random() * 1000),
            name: `VOID ${mockTypes[Math.floor(Math.random() * mockTypes.length)].toUpperCase()} #${Math.floor(Math.random() * 999)}`,
            description: "An exclusive NFT from the VOID collection",
            creator: "VOID_OFFICIAL",
            price: Math.random() * 2 + 0.1, // 0.1 - 2.1 SOL
            type: mockTypes[Math.floor(Math.random() * mockTypes.length)],
            shapeType: mockShapes[Math.floor(Math.random() * mockShapes.length)],
            color: mockColors[Math.floor(Math.random() * mockColors.length)],
            attributes: [
                { trait: "Rarity", value: Math.random() > 0.8 ? "Legendary" : Math.random() > 0.5 ? "Rare" : "Common" },
                { trait: "Generation", value: `Gen ${Math.floor(Math.random() * 3) + 1}` }
            ],
            history: [
                {
                    event: "Mint",
                    from: "VOID_OFFICIAL",
                    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
                }
            ],
            mint: mint.toString(),
        };
    };

    // Tải danh sách NFT của người dùng
    const loadOwnedNFTs = useCallback(async () => {
        if (!wallet.publicKey) return;

        try {
            setLoading(true);

            // Trong ứng dụng thực tế, bạn sẽ gọi API để lấy NFT của người dùng
            // Đây là ví dụ giả lập
            const mockMints = [
                new PublicKey('MintAddress1111111111111111111111111111111'),
                new PublicKey('MintAddress2222222222222222222222222222222'),
                new PublicKey('MintAddress3333333333333333333333333333333'),
            ];

            const nftsPromises = mockMints.map(async (mint) => {
                const tokenAccount = await getAssociatedTokenAddress(mint, wallet.publicKey!);
                const nftData = await mockFetchNFTData(mint);

                return {
                    ...nftData,
                    isListed: false,
                    tokenAccount: tokenAccount.toString(),
                } as NFT;
            });

            const nfts = await Promise.all(nftsPromises);
            setOwnedNFTs(nfts);
        } catch (error) {
            console.error('Error loading owned NFTs:', error);
            toast.error('Không thể tải NFT của bạn');
        } finally {
            setLoading(false);
        }
    }, [wallet.publicKey, connection]);

    // Tải danh sách NFT đang bán của người dùng
    const loadListedNFTs = useCallback(async () => {
        if (!wallet.publicKey) return;

        try {
            setLoading(true);

            // Lấy danh sách NFT đang bán của người dùng từ smart contract
            const listedItems = await marketplaceClient.getListedNFTsByOwner(wallet.publicKey);

            // Giả lập lấy thêm thông tin metadata
            const nftsPromises = listedItems.map(async (item: any) => {
                const nftData = await mockFetchNFTData(item.mint);

                return {
                    ...nftData,
                    price: item.price / 1_000_000_000, // Chuyển từ lamports sang SOL
                    isListed: true,
                    saleAccount: item.saleAccount.toString(),
                    tokenAccount: item.tokenAccount.toString(),
                } as NFT;
            });

            const nfts = await Promise.all(nftsPromises);
            setListedNFTs(nfts);
        } catch (error) {
            console.error('Error loading listed NFTs:', error);
            toast.error('Không thể tải danh sách NFT đang bán');
        } finally {
            setLoading(false);
        }
    }, [wallet.publicKey, connection, marketplaceClient]);

    // Tải danh sách NFT trên sàn giao dịch
    const loadMarketNFTs = useCallback(async () => {
        try {
            setLoading(true);

            // Lấy tất cả NFT đang bán trên sàn
            const marketItems = await marketplaceClient.getAllListedNFTs();

            // Lọc bỏ các NFT của chính người dùng (nếu có)
            const filteredItems = wallet.publicKey
                ? marketItems.filter((item: any) => !item.seller.equals(wallet.publicKey!))
                : marketItems;

            // Giả lập lấy thêm thông tin metadata
            const nftsPromises = filteredItems.map(async (item: any) => {
                const nftData = await mockFetchNFTData(item.mint);

                return {
                    ...nftData,
                    price: item.price / 1_000_000_000, // Chuyển từ lamports sang SOL
                    isListed: true,
                    saleAccount: item.saleAccount.toString(),
                    tokenAccount: item.tokenAccount.toString(),
                    creator: item.seller.toString().slice(0, 4) + '...' + item.seller.toString().slice(-4),
                } as NFT;
            });

            const nfts = await Promise.all(nftsPromises);
            setMarketNFTs(nfts);
        } catch (error) {
            console.error('Error loading market NFTs:', error);
            toast.error('Không thể tải NFT từ sàn giao dịch');
        } finally {
            setLoading(false);
        }
    }, [wallet.publicKey, connection, marketplaceClient]);

    // Đăng NFT lên sàn giao dịch
    const listNFTForSale = async (nft: NFT, price: number) => {
        if (!wallet.publicKey || !wallet.signTransaction) {
            toast.error('Vui lòng kết nối ví');
            return;
        }

        try {
            setLoading(true);

            const mint = new PublicKey(nft.mint!);
            const tokenAccount = new PublicKey(nft.tokenAccount!);
            const priceInLamports = price * 1_000_000_000; // Chuyển từ SOL sang lamports

            // Gọi hàm listNFTForSale từ marketplaceClient
            const signature = await marketplaceClient.listNFTForSale(
                wallet,
                mint,
                tokenAccount,
                priceInLamports,
                nft.type
            );

            // Thông báo thành công
            toast.success('NFT đã được đăng bán thành công', {
                description: `Giá: ${price} SOL`,
                action: {
                    label: 'Xem giao dịch',
                    onClick: () => window.open(`https://explorer.solana.com/tx/${signature}`, '_blank'),
                },
            });

            // Tải lại danh sách
            await Promise.all([loadOwnedNFTs(), loadListedNFTs(), loadMarketNFTs()]);
        } catch (error) {
            console.error('Error listing NFT for sale:', error);
            toast.error('Không thể đăng bán NFT');
        } finally {
            setLoading(false);
        }
    };

    // Gỡ NFT khỏi sàn giao dịch
    const cancelListing = async (nft: NFT) => {
        if (!wallet.publicKey || !wallet.signTransaction || !nft.saleAccount) {
            toast.error('Vui lòng kết nối ví hoặc NFT không hợp lệ');
            return;
        }

        try {
            setLoading(true);

            const saleAccount = new PublicKey(nft.saleAccount);

            // Gọi hàm cancelListing từ marketplaceClient
            const signature = await marketplaceClient.cancelListing(
                wallet,
                saleAccount
            );

            // Thông báo thành công
            toast.success('Đã gỡ NFT khỏi sàn giao dịch', {
                action: {
                    label: 'Xem giao dịch',
                    onClick: () => window.open(`https://explorer.solana.com/tx/${signature}`, '_blank'),
                },
            });

            // Tải lại danh sách
            await Promise.all([loadOwnedNFTs(), loadListedNFTs(), loadMarketNFTs()]);
        } catch (error) {
            console.error('Error canceling NFT listing:', error);
            toast.error('Không thể gỡ NFT khỏi sàn giao dịch');
        } finally {
            setLoading(false);
        }
    };

    // Chuyển NFT cho người khác
    const transferNFT = async (nft: NFT, receiverAddress: string) => {
        if (!wallet.publicKey || !wallet.signTransaction || !nft.mint || !nft.tokenAccount) {
            toast.error('Vui lòng kết nối ví hoặc NFT không hợp lệ');
            return;
        }

        try {
            setLoading(true);

            const receiverPubkey = new PublicKey(receiverAddress);
            const mint = new PublicKey(nft.mint);
            const senderTokenAccount = new PublicKey(nft.tokenAccount);

            // Lấy token account của người nhận
            const receiverTokenAccount = await getAssociatedTokenAddress(mint, receiverPubkey);

            // Gọi hàm transferNFT từ marketplaceClient
            const signature = await marketplaceClient.transferNFT(
                wallet,
                receiverPubkey,
                mint,
                senderTokenAccount,
                receiverTokenAccount
            );

            // Thông báo thành công
            toast.success('NFT đã được chuyển thành công', {
                description: `Đến: ${receiverAddress.slice(0, 4)}...${receiverAddress.slice(-4)}`,
                action: {
                    label: 'Xem giao dịch',
                    onClick: () => window.open(`https://explorer.solana.com/tx/${signature}`, '_blank'),
                },
            });

            // Tải lại danh sách
            await loadOwnedNFTs();
        } catch (error) {
            console.error('Error transferring NFT:', error);
            toast.error('Không thể chuyển NFT');
        } finally {
            setLoading(false);
        }
    };

    // Đốt (xóa vĩnh viễn) NFT
    const burnNFT = async (nft: NFT) => {
        if (!wallet.publicKey || !wallet.signTransaction || !nft.mint || !nft.tokenAccount) {
            toast.error('Vui lòng kết nối ví hoặc NFT không hợp lệ');
            return;
        }

        try {
            setLoading(true);

            const mint = new PublicKey(nft.mint);
            const tokenAccount = new PublicKey(nft.tokenAccount);

            // Gọi hàm burnNFT từ marketplaceClient
            const signature = await marketplaceClient.burnNFT(
                wallet,
                mint,
                tokenAccount
            );

            // Thông báo thành công
            toast.success('NFT đã được đốt thành công', {
                action: {
                    label: 'Xem giao dịch',
                    onClick: () => window.open(`https://explorer.solana.com/tx/${signature}`, '_blank'),
                },
            });

            // Tải lại danh sách
            await loadOwnedNFTs();
        } catch (error) {
            console.error('Error burning NFT:', error);
            toast.error('Không thể đốt NFT');
        } finally {
            setLoading(false);
        }
    };

    // Mua NFT từ sàn giao dịch
    const buyNFT = async (nft: NFT) => {
        if (!wallet.publicKey || !wallet.signTransaction || !nft.saleAccount) {
            toast.error('Vui lòng kết nối ví hoặc NFT không hợp lệ');
            return;
        }

        try {
            setLoading(true);

            const mint = new PublicKey(nft.mint!);
            const saleAccount = new PublicKey(nft.saleAccount);
            const seller = new PublicKey(nft.creator.includes('...')
                ? nft.creator.replace('...', '1111') // Thay thế tạm thời cho địa chỉ viết tắt
                : nft.creator);

            // Gọi hàm buyNFT từ marketplaceClient
            const signature = await marketplaceClient.buyNFT(
                wallet,
                seller,
                saleAccount,
                mint
            );

            // Thông báo thành công
            toast.success('NFT đã được mua thành công', {
                description: `Giá: ${nft.price} SOL`,
                action: {
                    label: 'Xem giao dịch',
                    onClick: () => window.open(`https://explorer.solana.com/tx/${signature}`, '_blank'),
                },
            });

            // Tải lại danh sách
            await Promise.all([loadOwnedNFTs(), loadMarketNFTs()]);
        } catch (error) {
            console.error('Error buying NFT:', error);
            toast.error('Không thể mua NFT');
        } finally {
            setLoading(false);
        }
    };

    // Load dữ liệu ban đầu
    useEffect(() => {
        if (wallet.publicKey) {
            loadOwnedNFTs();
            loadListedNFTs();
        }
        loadMarketNFTs();
    }, [wallet.publicKey, loadOwnedNFTs, loadListedNFTs, loadMarketNFTs]);

    return {
        loading,
        ownedNFTs,
        listedNFTs,
        marketNFTs,
        listNFTForSale,
        cancelListing,
        transferNFT,
        burnNFT,
        buyNFT,
        loadOwnedNFTs,
        loadListedNFTs,
        loadMarketNFTs,
    };
}; 