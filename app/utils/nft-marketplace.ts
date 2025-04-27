import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { serialize, deserialize } from 'borsh';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { NFTType } from '../types/nft';

// Các định nghĩa cấu trúc dữ liệu Borsh phù hợp với smart contract
class SaleData {
    is_initialized: boolean;
    seller: Uint8Array;
    mint: Uint8Array;
    token_account: Uint8Array;
    price: number;
    nft_type: number;

    constructor(props: {
        is_initialized: boolean;
        seller: Uint8Array;
        mint: Uint8Array;
        token_account: Uint8Array;
        price: number;
        nft_type: number;
    }) {
        this.is_initialized = props.is_initialized;
        this.seller = props.seller;
        this.mint = props.mint;
        this.token_account = props.token_account;
        this.price = props.price;
        this.nft_type = props.nft_type;
    }

    static schema = new Map([
        [
            SaleData,
            {
                kind: 'struct',
                fields: [
                    ['is_initialized', 'u8'],
                    ['seller', [32]],
                    ['mint', [32]],
                    ['token_account', [32]],
                    ['price', 'u64'],
                    ['nft_type', 'u8'],
                ],
            },
        ],
    ]);
}

// Các lệnh cho smart contract
enum MarketplaceInstructionType {
    InitializeMarketplace = 0,
    ListForSale = 1,
    RemoveSale = 2,
    BuyNFT = 3,
    TransferNFT = 4,
    BurnNFT = 5,
    MintNFT = 6,
}

// ID của smart contract NFT Marketplace
const PROGRAM_ID = new PublicKey('NFTMarketplace111111111111111111111111111111111');

// Lớp tương tác với NFT Marketplace
export class NFTMarketplaceClient {
    private connection: Connection;
    private programId: PublicKey;

    constructor(connection: Connection, programId: PublicKey = PROGRAM_ID) {
        this.connection = connection;
        this.programId = programId;
    }

    /**
     * Đăng NFT lên sàn giao dịch
     * @param wallet Ví của người bán
     * @param mint Mint address của NFT
     * @param tokenAccount Token account chứa NFT
     * @param price Giá bán (lamports)
     * @param nftType Loại NFT (cube, music, v.v.)
     */
    async listNFTForSale(
        wallet: any,
        mint: PublicKey,
        tokenAccount: PublicKey,
        price: number,
        nftType: NFTType
    ): Promise<string> {
        // Tạo account mới cho thông tin bán
        const saleAccount = Keypair.generate();

        // Mã hóa data cho instruction ListForSale
        const instructionData = Buffer.alloc(9);
        instructionData.writeUInt8(MarketplaceInstructionType.ListForSale, 0);
        instructionData.writeBigUInt64LE(BigInt(price), 1);

        // Thêm thông tin NFT type
        const nftTypeValue = nftType === 'cube' ? 0 : nftType === 'music' ? 1 : 2;

        // Tạo instruction
        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: tokenAccount, isSigner: false, isWritable: true },
                { pubkey: mint, isSigner: false, isWritable: false },
                { pubkey: saleAccount.publicKey, isSigner: true, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            programId: this.programId,
            data: Buffer.concat([instructionData, Buffer.from([nftTypeValue])]),
        });

        // Tạo và gửi transaction
        const transaction = new Transaction().add(instruction);

        try {
            // Ký và gửi transaction
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (
                await this.connection.getRecentBlockhash()
            ).blockhash;

            // Ký với cả wallet và saleAccount
            transaction.sign(saleAccount);

            // Gửi và chờ kết quả
            const signature = await wallet.sendTransaction(transaction, this.connection);
            await this.connection.confirmTransaction(signature, 'confirmed');

            return signature;
        } catch (error) {
            console.error('Error listing NFT for sale:', error);
            throw error;
        }
    }

    /**
     * Chuyển NFT cho người khác
     * @param wallet Ví người gửi
     * @param receiverPubkey Địa chỉ người nhận
     * @param mint Mint address của NFT
     * @param senderTokenAccount Token account của người gửi
     * @param receiverTokenAccount Token account của người nhận
     */
    async transferNFT(
        wallet: any,
        receiverPubkey: PublicKey,
        mint: PublicKey,
        senderTokenAccount: PublicKey,
        receiverTokenAccount: PublicKey
    ): Promise<string> {
        // Tạo data cho instruction TransferNFT
        const instructionData = Buffer.alloc(1);
        instructionData.writeUInt8(MarketplaceInstructionType.TransferNFT, 0);

        // Lấy marketplace state address
        const [marketplaceStateAddress] = await PublicKey.findProgramAddress(
            [Buffer.from('marketplace_state')],
            this.programId
        );

        // Lấy treasury address
        const [treasuryAddress] = await PublicKey.findProgramAddress(
            [Buffer.from('treasury')],
            this.programId
        );

        // Tạo instruction
        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: receiverPubkey, isSigner: false, isWritable: true },
                { pubkey: mint, isSigner: false, isWritable: false },
                { pubkey: senderTokenAccount, isSigner: false, isWritable: true },
                { pubkey: receiverTokenAccount, isSigner: false, isWritable: true },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: marketplaceStateAddress, isSigner: false, isWritable: false },
                { pubkey: treasuryAddress, isSigner: false, isWritable: true },
            ],
            programId: this.programId,
            data: instructionData,
        });

        // Tạo và gửi transaction
        const transaction = new Transaction().add(instruction);

        try {
            // Ký và gửi transaction
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (
                await this.connection.getRecentBlockhash()
            ).blockhash;

            // Gửi và chờ kết quả
            const signature = await wallet.sendTransaction(transaction, this.connection);
            await this.connection.confirmTransaction(signature, 'confirmed');

            return signature;
        } catch (error) {
            console.error('Error transferring NFT:', error);
            throw error;
        }
    }

    /**
     * Đốt (xóa vĩnh viễn) NFT
     * @param wallet Ví chủ sở hữu
     * @param mint Mint address của NFT
     * @param tokenAccount Token account chứa NFT
     */
    async burnNFT(
        wallet: any,
        mint: PublicKey,
        tokenAccount: PublicKey
    ): Promise<string> {
        // Tạo data cho instruction BurnNFT
        const instructionData = Buffer.alloc(1);
        instructionData.writeUInt8(MarketplaceInstructionType.BurnNFT, 0);

        // Tạo instruction
        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: mint, isSigner: false, isWritable: true },
                { pubkey: tokenAccount, isSigner: false, isWritable: true },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            ],
            programId: this.programId,
            data: instructionData,
        });

        // Tạo và gửi transaction
        const transaction = new Transaction().add(instruction);

        try {
            // Ký và gửi transaction
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (
                await this.connection.getRecentBlockhash()
            ).blockhash;

            // Gửi và chờ kết quả
            const signature = await wallet.sendTransaction(transaction, this.connection);
            await this.connection.confirmTransaction(signature, 'confirmed');

            return signature;
        } catch (error) {
            console.error('Error burning NFT:', error);
            throw error;
        }
    }

    /**
     * Gỡ NFT khỏi marketplace
     * @param wallet Ví người bán
     * @param saleAccount Account chứa thông tin bán
     */
    async cancelListing(
        wallet: any,
        saleAccount: PublicKey
    ): Promise<string> {
        // Tạo data cho instruction RemoveSale
        const instructionData = Buffer.alloc(1);
        instructionData.writeUInt8(MarketplaceInstructionType.RemoveSale, 0);

        // Tạo instruction
        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: saleAccount, isSigner: false, isWritable: true },
            ],
            programId: this.programId,
            data: instructionData,
        });

        // Tạo và gửi transaction
        const transaction = new Transaction().add(instruction);

        try {
            // Ký và gửi transaction
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (
                await this.connection.getRecentBlockhash()
            ).blockhash;

            // Gửi và chờ kết quả
            const signature = await wallet.sendTransaction(transaction, this.connection);
            await this.connection.confirmTransaction(signature, 'confirmed');

            return signature;
        } catch (error) {
            console.error('Error canceling NFT listing:', error);
            throw error;
        }
    }

    /**
     * Lấy danh sách NFT đang bán của một người dùng
     * @param ownerPubkey Địa chỉ ví của người dùng
     */
    async getListedNFTsByOwner(ownerPubkey: PublicKey): Promise<any[]> {
        // Lấy tất cả các account thuộc chương trình
        const accounts = await this.connection.getProgramAccounts(this.programId, {
            filters: [
                {
                    memcmp: {
                        offset: 1, // Offset cho seller field trong SaleData
                        bytes: ownerPubkey.toBase58(),
                    },
                },
                {
                    dataSize: 1 + 32 + 32 + 32 + 8 + 1, // Size của SaleData
                },
            ],
        });

        // Chuyển đổi dữ liệu account thành đối tượng SaleData
        return accounts.map((account) => {
            const saleData = deserialize(
                SaleData.schema,
                SaleData,
                account.account.data
            );

            return {
                saleAccount: account.pubkey,
                seller: new PublicKey(saleData.seller),
                mint: new PublicKey(saleData.mint),
                tokenAccount: new PublicKey(saleData.token_account),
                price: saleData.price,
                nftType: saleData.nft_type === 0 ? 'cube' : saleData.nft_type === 1 ? 'music' : 'other',
            };
        });
    }

    /**
     * Mua NFT từ marketplace
     * @param wallet Ví người mua
     * @param sellerPubkey Địa chỉ ví người bán
     * @param saleAccount Account chứa thông tin bán
     * @param sellerTokenAccount Token account của người bán
     * @param buyerTokenAccount Token account của người mua
     */
    async buyNFT(
        wallet: any,
        sellerPubkey: PublicKey,
        saleAccount: PublicKey,
        sellerTokenAccount: PublicKey,
        buyerTokenAccount: PublicKey
    ): Promise<string> {
        // Tạo data cho instruction BuyNFT
        const instructionData = Buffer.alloc(1);
        instructionData.writeUInt8(MarketplaceInstructionType.BuyNFT, 0);

        // Lấy marketplace state address
        const [marketplaceStateAddress] = await PublicKey.findProgramAddress(
            [Buffer.from('marketplace_state')],
            this.programId
        );

        // Lấy treasury address
        const [treasuryAddress] = await PublicKey.findProgramAddress(
            [Buffer.from('treasury')],
            this.programId
        );

        // Tạo instruction
        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: sellerPubkey, isSigner: false, isWritable: true },
                { pubkey: saleAccount, isSigner: false, isWritable: true },
                { pubkey: sellerTokenAccount, isSigner: false, isWritable: true },
                { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: marketplaceStateAddress, isSigner: false, isWritable: false },
                { pubkey: treasuryAddress, isSigner: false, isWritable: true },
            ],
            programId: this.programId,
            data: instructionData,
        });

        // Tạo và gửi transaction
        const transaction = new Transaction().add(instruction);

        try {
            // Ký và gửi transaction
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (
                await this.connection.getRecentBlockhash()
            ).blockhash;

            // Gửi và chờ kết quả
            const signature = await wallet.sendTransaction(transaction, this.connection);
            await this.connection.confirmTransaction(signature, 'confirmed');

            return signature;
        } catch (error) {
            console.error('Error buying NFT:', error);
            throw error;
        }
    }

    /**
     * Lấy tất cả NFT đang bán trên marketplace
     */
    async getAllListedNFTs(): Promise<any[]> {
        // Lấy tất cả các account thuộc chương trình có kích thước dữ liệu của SaleData
        const accounts = await this.connection.getProgramAccounts(this.programId, {
            filters: [
                {
                    dataSize: 1 + 32 + 32 + 32 + 8 + 1, // Size của SaleData
                },
            ],
        });

        // Chuyển đổi dữ liệu account thành đối tượng SaleData
        return accounts.map((account) => {
            const saleData = deserialize(
                SaleData.schema,
                SaleData,
                account.account.data
            );

            return {
                saleAccount: account.pubkey,
                seller: new PublicKey(saleData.seller),
                mint: new PublicKey(saleData.mint),
                tokenAccount: new PublicKey(saleData.token_account),
                price: saleData.price,
                nftType: saleData.nft_type === 0 ? 'cube' : saleData.nft_type === 1 ? 'music' : 'other',
            };
        });
    }
} 