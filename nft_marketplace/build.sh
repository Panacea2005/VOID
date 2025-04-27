#!/bin/bash

echo "Building Solana NFT Marketplace Program..."

# Kiểm tra cargo build-bpf đã được cài đặt chưa
if ! command -v cargo build-bpf &> /dev/null
then
    echo "cargo build-bpf không được tìm thấy, đang cài đặt..."
    sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
fi

# Xây dựng chương trình
cargo build-bpf

# Kiểm tra xây dựng thành công
if [ $? -eq 0 ]
then
    echo "Xây dựng hoàn tất!"
    echo "Sử dụng lệnh sau để triển khai chương trình:"
    echo "solana program deploy ./target/deploy/nft_marketplace.so"
else
    echo "Xây dựng thất bại!"
fi

# Tạo keypair cho chương trình nếu chưa tồn tại
if [ ! -f ./program-keypair.json ]; then
    echo "Tạo keypair cho chương trình..."
    solana-keygen new -o ./program-keypair.json --no-bip39-passphrase
    echo "Keypair đã được tạo tại: ./program-keypair.json"
fi 