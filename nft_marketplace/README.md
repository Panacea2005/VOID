# NFT Marketplace Smart Contract cho Game trên Solana

Smart contract này được viết bằng Rust cho Solana blockchain, hỗ trợ quản lý NFT trong một game với các loại NFT khác nhau như "cube" và "music".

## Tính năng

1. **Đăng bán NFT**: Người dùng có thể đăng bán NFT của mình trên marketplace với giá tự đặt
2. **Chuyển NFT**: Người dùng có thể chuyển NFT trực tiếp cho người khác (có tính phí giao dịch)
3. **Burn NFT**: Người dùng có thể xóa vĩnh viễn NFT của mình
4. **Quản lý NFT đang bán**: NFT đã đăng bán sẽ xuất hiện trong mục "Listed NFTs" của người dùng
5. **Mua NFT**: Người dùng có thể mua NFT từ marketplace

## Cài đặt

```bash
git clone <repository_url>
cd nft_marketplace
```

## Build

```bash
# Thêm wasm target nếu chưa có
rustup target add wasm32-unknown-unknown

# Build smart contract
cargo build-bpf
```

## Triển khai

### Kết nối với ví Phantom

1. Cài đặt Phantom Wallet từ [phantom.app](https://phantom.app/)
2. Tạo ví mới hoặc import ví hiện có
3. Chuyển sang mạng Solana Devnet (để thử nghiệm) hoặc Mainnet (cho production)
4. Tài trợ ví với SOL từ [Solana Faucet](https://solfaucet.com/) nếu đang sử dụng Devnet

### Triển khai Contract

```bash
# Cài đặt Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Thiết lập kết nối với devnet
solana config set --url devnet
```

#### Nếu bạn đã có ví Phantom và muốn sử dụng:

1. Xuất Private Key từ ví Phantom:
   - Mở extension Phantom trên trình duyệt
   - Nhấp vào biểu tượng cài đặt (bánh răng) ở góc dưới bên phải
   - Chọn "Export Private Key" và nhập mật khẩu
   - Sao chép Private Key

2. Import Private Key vào Solana CLI:
   ```bash
   # Tạo file keypair
   solana-keygen recover -o phantom-wallet.json
   ```
   Sau đó dán Private Key đã sao chép từ Phantom khi được nhắc

3. Thiết lập Keypair mặc định:
   ```bash
   solana config set --keypair phantom-wallet.json
   ```

4. Kiểm tra số dư:
   ```bash
   solana balance
   ```

5. Triển khai program sử dụng keypair đã import:
   ```bash
   solana program deploy target/deploy/nft_marketplace.so
   ```

#### Nếu bạn muốn tạo keypair mới:

```bash
# Tạo keypair mới
solana-keygen new

# Triển khai program
solana program deploy target/deploy/nft_marketplace.so
```

### Kết nối Frontend với Phantom

Ví dụ về cách kết nối frontend với Phantom Wallet:

```javascript
// Kiểm tra và kết nối với Phantom
const connectPhantom = async () => {
  try {
    const { solana } = window;
    
    if (!solana || !solana.isPhantom) {
      throw new Error("Phantom wallet extension not found!");
    }
    
    const response = await solana.connect();
    console.log('Connected with Public Key:', response.publicKey.toString());
    return response.publicKey;
  } catch (error) {
    console.error(error);
  }
};
```

## Tương tác với Smart Contract

### Khởi tạo Marketplace

```javascript
const initializeMarketplace = async (connection, wallet, treasuryId, transactionFee) => {
  const transaction = new solana.Transaction();
  
  // Tạo account cho marketplace state
  const marketplaceAccount = solana.Keypair.generate();
  
  // Create transaction instruction
  const instruction = new solana.TransactionInstruction({
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: marketplaceAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: solana.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: YOUR_PROGRAM_ID,
    data: Buffer.from(...) // Encode instruction data
  });
  
  transaction.add(instruction);
  
  // Sign and send transaction
  const signature = await wallet.signTransaction(transaction);
  await connection.sendRawTransaction(signature.serialize());
  
  return marketplaceAccount.publicKey;
};
```

### Mint NFT

```javascript
const mintNFT = async (connection, wallet, metadata, recipient) => {
  // Create the mint account
  const mint = solana.Keypair.generate();
  
  // Create token account for recipient
  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint.publicKey,
    new solana.PublicKey(recipient)
  );
  
  // Create metadata account
  const metadataAccount = await getMetadataAccount(mint.publicKey);
  
  // Create instruction
  const instruction = new solana.TransactionInstruction({
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: mint.publicKey, isSigner: false, isWritable: true },
      { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
      { pubkey: metadataAccount, isSigner: false, isWritable: true },
      { pubkey: solana.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: solana.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: marketplaceAccount, isSigner: false, isWritable: false },
    ],
    programId: YOUR_PROGRAM_ID,
    data: Buffer.from(...) // Encode instruction data
  });
  
  // Create and send transaction
  const transaction = new solana.Transaction().add(instruction);
  const signature = await wallet.signTransaction(transaction);
  await connection.sendRawTransaction(signature.serialize());
};
```

### Đăng bán NFT

```javascript
const listNFTForSale = async (connection, wallet, mint, price, nftType) => {
  // Find user's token account for this mint
  const tokenAccount = await getAssociatedTokenAddress(
    mint,
    wallet.publicKey
  );
  
  // Create sale account
  const saleAccount = solana.Keypair.generate();
  
  // Create instruction
  const instruction = new solana.TransactionInstruction({
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: tokenAccount, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: saleAccount.publicKey, isSigner: true, isWritable: true },
      { pubkey: solana.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: YOUR_PROGRAM_ID,
    data: Buffer.from(...) // Encode instruction data with price and nftType
  });
  
  // Create and send transaction
  const transaction = new solana.Transaction().add(instruction);
  transaction.feePayer = wallet.publicKey;
  const signature = await wallet.signTransaction(transaction);
  await connection.sendRawTransaction(signature.serialize());
};
```

### Mua NFT

```javascript
const buyNFT = async (connection, wallet, saleAccount) => {
  // Lấy thông tin về sale
  const saleInfo = await connection.getAccountInfo(saleAccount);
  const saleData = deserializeSaleData(saleInfo.data);
  
  // Tạo token account cho người mua
  const buyerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    saleData.mint,
    wallet.publicKey
  );
  
  // Create instruction
  const instruction = new solana.TransactionInstruction({
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: saleData.seller, isSigner: false, isWritable: true },
      { pubkey: saleAccount, isSigner: false, isWritable: true },
      { pubkey: saleData.tokenAccount, isSigner: false, isWritable: true },
      { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: solana.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: marketplaceAccount, isSigner: false, isWritable: false },
      { pubkey: treasuryAccount, isSigner: false, isWritable: true },
    ],
    programId: YOUR_PROGRAM_ID,
    data: Buffer.from([1]) // Buy instruction
  });
  
  // Create and send transaction
  const transaction = new solana.Transaction().add(instruction);
  transaction.feePayer = wallet.publicKey;
  const signature = await wallet.signTransaction(transaction);
  await connection.sendRawTransaction(signature.serialize());
};
```

## Cấu trúc dữ liệu

- **NFTType**: Loại NFT (Cube, Music)
- **SaleData**: Thông tin về NFT đang bán (chủ sở hữu, giá, loại NFT)
- **MarketplaceState**: Thông tin metadata của marketplace (owner, treasury, phí giao dịch)

## Phí giao dịch

Phí giao dịch được tính dưới dạng phần trăm, được nhân với 100. Ví dụ, 5% = 500. Phí này được áp dụng cho các giao dịch mua NFT và chuyển NFT.

## Lưu ý bảo mật

- Tất cả các hàm thay đổi trạng thái của NFT đều yêu cầu xác thực chủ sở hữu
- Các giao dịch tài chính đều có cơ chế kiểm tra số dư và xử lý phí giao dịch
- Smart contract tuân thủ tiêu chuẩn Token Metadata của Metaplex cho NFT trên Solana

## Troubleshooting

### Lỗi phổ biến và cách khắc phục

1. **"Transaction simulation failed: Attempt to debit an account but found no record of a prior credit"**:
   - Đảm bảo tài khoản người gửi có đủ SOL để chi trả phí giao dịch
   - Nếu là tài khoản PDA (Program Derived Address), đảm bảo nó đã được tạo và funded

2. **"Transaction simulation failed: Error processing Instruction"**:
   - Kiểm tra logs để xem lỗi cụ thể
   - Đảm bảo bạn đang truyền đúng accounts và theo đúng thứ tự

3. **"Error: could not find wallet key <public_key>"**:
   - Đảm bảo bạn đã kết nối với ví Phantom
   - Đảm bảo Phantom có quyền truy cập vào trang web của bạn

4. **"Error: Signature verification failed"**:
   - Đảm bảo bạn đang ký transaction với đúng ví và đúng key

5. **"Token account <account> does not exist"**:
   - Đảm bảo tài khoản token đã được tạo trước khi sử dụng
   - Sử dụng getOrCreateAssociatedTokenAccount để tự động tạo tài khoản token nếu nó không tồn tại 