import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

export interface WalletData {
    address: string;
    displayName: string;
    joinedDate: string;
    balance: number;
    totalValue: number;
    transactions: number;
    nftsOwned: number;
    nftsMinted: number;
}

export interface NFTData {
    id: string;
    name: string;
    collection: string;
    acquired?: string;
    minted?: string;
    listed?: string;
    price: number;
    type: string;
    shapeType: string;
    color: string;
    image?: string;
}

const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const connection = new Connection(endpoint);

// Lấy thông tin ví
export async function getWalletInfo(publicKey: PublicKey): Promise<WalletData> {
    try {
        // Lấy số dư
        const balance = await connection.getBalance(publicKey);
        const balanceInSOL = balance / LAMPORTS_PER_SOL;

        // Lấy lịch sử giao dịch
        const transactions = await connection.getSignaturesForAddress(publicKey, {
            limit: 100,
        });

        // Đối với NFT, trong thực tế bạn sẽ cần sử dụng thư viện như Metaplex để lấy NFTs
        // Đây là ví dụ đơn giản
        const nftsOwned = 0; // Sẽ cập nhật sau với thư viện Metaplex

        // Lấy thông tin ví từ chương trình NFT, v.v.
        // Đây là mock data, trong thực tế bạn cần lấy từ blockchain
        const mockPortfolioValue = balanceInSOL * 1.5; // Giả định giá trị portfolio

        // Tạo ngày joined dựa trên giao dịch đầu tiên (nếu có)
        // Nếu không có giao dịch hoặc giao dịch không có blockTime, hiển thị ngày hiện tại
        let joinedDate;
        if (transactions.length > 0) {
            const firstTx = transactions[transactions.length - 1];
            if (firstTx.blockTime) {
                const date = new Date(firstTx.blockTime * 1000);
                const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                joinedDate = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            } else {
                // Nếu không có blockTime, sử dụng ngày hiện tại
                const currentDate = new Date();
                const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                joinedDate = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
            }
        } else {
            // Nếu không có giao dịch, sử dụng ngày hiện tại
            const currentDate = new Date();
            const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
            joinedDate = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }

        return {
            address: publicKey.toString(),
            displayName: "VOID_COLLECTOR", // Cần lấy từ profile service nếu có
            joinedDate,
            balance: balanceInSOL,
            totalValue: mockPortfolioValue,
            transactions: transactions.length,
            nftsOwned,
            nftsMinted: 0,  // Cần thêm logic để tính NFTs đã mint
        };
    } catch (error) {
        console.error("Error fetching wallet data:", error);
        throw error;
    }
}

// Lấy NFTs của ví
export async function getNFTs(publicKey: PublicKey): Promise<{
    ownedNFTs: NFTData[];
    mintedNFTs: NFTData[];
    listedNFTs: NFTData[];
}> {
    try {
        // Trong thực tế, bạn sẽ cần Metaplex để lấy danh sách NFTs
        // Đây là mặc định trả về mảng rỗng vì chưa có implement với Metaplex

        // Mảng rỗng để không hiển thị fake data
        const ownedNFTs: NFTData[] = [];
        const mintedNFTs: NFTData[] = [];
        const listedNFTs: NFTData[] = [];

        // Khi tích hợp Metaplex, bạn sẽ thay thế đoạn này với code thực tế
        // Ví dụ:
        // const metaplex = new Metaplex(connection);
        // const nfts = await metaplex.nfts().findAllByOwner({ owner: publicKey });
        // ownedNFTs = nfts.map(nft => { ... });

        return {
            ownedNFTs,
            mintedNFTs,
            listedNFTs,
        };
    } catch (error) {
        console.error("Error fetching NFTs:", error);
        throw error;
    }
}

// Lấy lịch sử giao dịch
export async function getTransactionHistory(publicKey: PublicKey) {
    try {
        const signatures = await connection.getSignaturesForAddress(publicKey);
        const transactions = [];

        for (let i = 0; i < Math.min(5, signatures.length); i++) {
            const signature = signatures[i];
            const tx = await connection.getTransaction(signature.signature, {
                maxSupportedTransactionVersion: 0,
            });

            if (tx) {
                transactions.push({
                    signature: signature.signature,
                    blockTime: signature.blockTime ? new Date(signature.blockTime * 1000).toISOString().split('T')[0] : 'Unknown',
                    type: tx.meta?.logMessages?.some(msg => msg.includes("Initialize mint")) ? "Mint" : "Transfer",
                    amount: tx.meta?.postBalances && tx.meta?.preBalances ?
                        Math.abs(tx.meta.postBalances[0] - tx.meta.preBalances[0]) / LAMPORTS_PER_SOL : 0,
                });
            }
        }

        return transactions;
    } catch (error) {
        console.error("Error fetching transaction history:", error);
        return [];
    }
}

// Utility function để rút gọn địa chỉ ví
export function shortenAddress(address: string, chars = 4) {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
} 