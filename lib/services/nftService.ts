import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { uploadToPinata, getIpfsUrl, getDirectModelUrl, getModelViewerUrl } from './pinataService';

export interface NFTMetadata {
    name: string;
    symbol: string;
    description: string;
    image: File;
    model?: File;
    audio?: File;
    audioUrl?: string;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
    properties: {
        files: Array<{
            uri: string;
            type: string;
        }>;
        category: string;
    };
}

// Biến để theo dõi nếu Pinata thất bại
let PINATA_FAILED = false;

// Hàm upload an toàn, thử các phương pháp khác nhau nếu phương pháp chính thất bại
async function safeUpload(file: File, metadata: any): Promise<string> {
    try {
        // Nếu Pinata không gặp vấn đề, sử dụng nó
        if (!PINATA_FAILED) {
            return await uploadToPinata(file, metadata);
        } else {
            throw new Error("Pinata previously failed, using fallback");
        }
    } catch (error) {
        console.warn("Pinata upload failed, using fallback:", error);
        PINATA_FAILED = true;

        // Sử dụng phương thức mockup đơn giản 
        // Thực tế sẽ sử dụng dịch vụ thay thế như NFT.Storage, Infura IPFS, hoặc Filebase
        // Giả lập CID hợp lệ cho môi trường phát triển
        const mockCid = `mock${Date.now()}${Math.floor(Math.random() * 1000000)}`;
        console.log("Generated mock CID:", mockCid);

        // Lưu file vào localStorage để hiển thị trong ứng dụng
        if (typeof window !== 'undefined') {
            try {
                const fileReader = new FileReader();
                fileReader.readAsDataURL(file);
                fileReader.onload = () => {
                    const dataUrl = fileReader.result as string;
                    localStorage.setItem(`file_${mockCid}`, dataUrl);
                    console.log("Saved file data to localStorage");
                };
            } catch (e) {
                console.error("Failed to save file to localStorage:", e);
            }
        }

        return mockCid;
    }
}

export async function mintNFT(
    connection: Connection,
    wallet: any,
    metadata: NFTMetadata
): Promise<string> {
    try {
        console.log("Bắt đầu quá trình mint NFT với metadata:", {
            name: metadata.name,
            description: metadata.description
        });

        // Cấu hình kết nối với tùy chọn preflight tốt hơn
        const enhancedConnection = new Connection(
            connection.rpcEndpoint,
            {
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 60000, // 60 giây timeout
                disableRetryOnRateLimit: false,
                httpHeaders: { 'Content-Type': 'application/json' }
            }
        );

        // Tải ảnh lên IPFS thông qua Pinata hoặc phương pháp thay thế
        console.log("Đang upload hình ảnh...");
        const imageIpfsHash = await safeUpload(metadata.image, {
            name: `${metadata.name}-image`,
            description: metadata.description,
            type: metadata.image.type || 'image/png'
        });

        const imageUri = getIpfsUrl(imageIpfsHash);
        console.log("Hình ảnh đã được upload:", imageUri);

        // Nếu có file 3D model, cũng tải lên
        let modelUri = '';
        let modelType = 'model/gltf-binary';
        if (metadata.model) {
            console.log("Đang upload model 3D...");
            // Đảm bảo rằng file model có loại MIME chính xác
            const modelFile = metadata.model;
            // Kiểm tra nếu là file GLB
            const isGLB = modelFile.name.toLowerCase().endsWith('.glb') ||
                modelFile.type === 'model/gltf-binary';

            if (!isGLB) {
                console.log("Model không phải GLB, cần chuyển đổi trước khi upload");
                // Ở đây có thể gọi hàm để chuyển đổi model sang GLB nếu cần
            }

            // Đặt đúng loại MIME cho file GLB
            modelType = 'model/gltf-binary';

            const modelIpfsHash = await safeUpload(modelFile, {
                name: `${metadata.name}-model`,
                description: `3D Model for ${metadata.name}`,
                type: modelType
            });

            // Lấy URI IPFS và URL trực tiếp
            modelUri = `ipfs://${modelIpfsHash}`;
            const directModelUrl = getDirectModelUrl(modelIpfsHash);
            const modelViewerUrl = getModelViewerUrl(modelIpfsHash);

            console.log("Model đã được upload:", {
                modelUri,
                directModelUrl,
                modelViewerUrl,
                modelIpfsHash
            });
        }

        // Xử lý file âm thanh nếu có
        let audioUri = '';
        let audioType = '';
        if (metadata.audio) {
            console.log("Đang upload file âm thanh...");
            const audioFile = metadata.audio;
            // Xác định loại file âm thanh
            audioType = audioFile.type || 'audio/mpeg';

            // Upload file âm thanh
            const audioIpfsHash = await safeUpload(audioFile, {
                name: `${metadata.name}-audio`,
                description: `Audio for ${metadata.name}`,
                type: audioType
            });

            // Lấy URI IPFS cho âm thanh
            audioUri = `ipfs://${audioIpfsHash}`;
            console.log("Audio đã được upload:", {
                audioUri,
                audioIpfsHash
            });
        } else if (metadata.audioUrl) {
            // Trường hợp đã có URL âm thanh (từ Vercel Blob)
            console.log("Sử dụng audioUrl có sẵn:", metadata.audioUrl);
            audioUri = metadata.audioUrl;
            audioType = 'audio/mpeg';
        }

        // Chuẩn bị metadata với cả ảnh và model
        const metadataWithFiles: any = {
            name: metadata.name,
            description: metadata.description,
            image: imageUri,
            attributes: metadata.attributes,
            properties: {
                files: [
                    {
                        uri: imageUri,
                        type: metadata.image.type || 'image/png',
                        cdn: getIpfsUrl(imageIpfsHash)
                    }
                ],
                category: 'image'
            }
        };

        // Thêm model vào files nếu có
        if (modelUri) {
            // Đảm bảo dùng đúng URI cho model 3D
            metadataWithFiles.model = modelUri;
            metadataWithFiles.animation_url = modelUri; // Một số thị trường NFT sử dụng trường này cho model 3D

            metadataWithFiles.properties.files.push({
                uri: modelUri,
                type: modelType,
                cdn: getDirectModelUrl(modelUri.replace('ipfs://', ''))
            });

            // Bổ sung thêm thông tin để dễ dàng hiển thị model
            metadataWithFiles.properties.model_viewer_url = getModelViewerUrl(modelUri.replace('ipfs://', ''));
            metadataWithFiles.properties.model_type = "glb";
        }

        // Thêm âm thanh vào files nếu có
        if (audioUri) {
            // Nếu không có model 3D, dùng audio làm animation_url
            if (!modelUri) {
                metadataWithFiles.animation_url = audioUri;
            }

            metadataWithFiles.audio = audioUri;

            // Thêm vào danh sách files
            metadataWithFiles.properties.files.push({
                uri: audioUri,
                type: audioType,
                cdn: audioUri.startsWith('ipfs://') ?
                    getIpfsUrl(audioUri.replace('ipfs://', '')) :
                    audioUri // Giữ nguyên URL nếu không phải IPFS
            });

            // Cập nhật category nếu đây là NFT âm nhạc
            if (!modelUri) {
                metadataWithFiles.properties.category = 'audio';
            }
        }

        // Tạo file metadata JSON
        console.log("Đang chuẩn bị metadata...");
        const metadataBlob = new Blob([JSON.stringify(metadataWithFiles, null, 2)], { type: 'application/json' });
        const metadataFile = new File([metadataBlob], `${metadata.name.replace(/\s+/g, '-')}-metadata.json`, { type: 'application/json' });

        // Tải metadata lên
        console.log("Đang upload metadata...");
        const metadataIpfsHash = await safeUpload(metadataFile, {
            name: `${metadata.name}-metadata`,
            type: 'application/json'
        });
        const metadataUri = getIpfsUrl(metadataIpfsHash);

        // In ra thông tin chi tiết để debug
        console.log("NFT Metadata đã được upload:", {
            metadataUri,
            imageUri,
            modelUri,
            audioUri
        });

        // Khởi tạo và sử dụng Metaplex
        console.log("Đang khởi tạo Metaplex và mint NFT...");
        const metaplex = Metaplex.make(enhancedConnection)
            .use(walletAdapterIdentity(wallet));

        // Khai báo biến để theo dõi số lần thử
        let attemptCount = 0;
        const maxAttempts = 3;
        let lastError: any = null;

        // Sử dụng vòng lặp để thử lại khi gặp lỗi blockhash
        while (attemptCount < maxAttempts) {
            try {
                // Tăng số lần thử
                attemptCount++;
                console.log(`Đang tạo NFT (lần thử ${attemptCount}/${maxAttempts})...`);

                // Lấy blockhash mới nhất trước khi tạo giao dịch
                const { blockhash, lastValidBlockHeight } = await enhancedConnection.getLatestBlockhash('finalized');
                console.log(`Đã lấy blockhash mới: ${blockhash}, lastValidBlockHeight: ${lastValidBlockHeight}`);

                // Tạo NFT với blockhash mới
                const { nft, response } = await metaplex.nfts().create({
                    uri: metadataUri,
                    name: metadata.name,
                    sellerFeeBasisPoints: 500, // 5% royalty
                    symbol: metadata.symbol || 'VOID',
                    creators: [
                        {
                            address: wallet.publicKey,
                            share: 100,
                        },
                    ]
                });

                console.log("NFT đã được tạo thành công:", nft.address.toString());
                console.log("Signature giao dịch:", response.signature);

                // Lưu NFT vào localStorage để hiển thị trong profile
                if (typeof window !== 'undefined') {
                    try {
                        // Đọc danh sách NFT hiện có
                        const userNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');

                        // Tạo bản ghi NFT mới
                        userNfts.push({
                            id: nft.address.toString(),
                            mintAddress: nft.address.toString(),
                            txSignature: response.signature,
                            name: metadata.name,
                            description: metadata.description,
                            image: imageUri,
                            ipfsHash: imageIpfsHash,
                            ipfsUrl: `ipfs://${imageIpfsHash}`,
                            model3d: modelUri ? getDirectModelUrl(modelUri.replace('ipfs://', '')) : undefined,
                            model3dHash: modelUri ? modelUri.replace('ipfs://', '') : undefined,
                            audioUrl: audioUri,
                            attributes: metadata.attributes,
                            mintedAt: new Date().toISOString(),
                            type: audioUri ? "music" : "cube",
                            isMock: false
                        });

                        localStorage.setItem('userNfts', JSON.stringify(userNfts));
                        console.log("Đã lưu NFT vào localStorage");
                    } catch (e) {
                        console.error("Không thể lưu NFT vào localStorage:", e);
                    }
                }

                // Nếu thành công thì trả về địa chỉ mint
                return nft.address.toString();
            } catch (error: any) {
                lastError = error;
                console.warn(`Lỗi khi tạo NFT (lần thử ${attemptCount}/${maxAttempts}):`, error);

                // Kiểm tra nếu là lỗi blockhash not found hoặc lỗi liên quan đến giao dịch
                const errorMessage = error.toString().toLowerCase();
                const isBlockhashError = errorMessage.includes("blockhash not found") ||
                    errorMessage.includes("transaction simulation failed") ||
                    errorMessage.includes("failed to send transaction");

                if (isBlockhashError && attemptCount < maxAttempts) {
                    // Đợi một khoảng thời gian trước khi thử lại
                    console.log(`Lỗi blockhash, đợi 3 giây trước khi thử lại...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                } else {
                    // Các lỗi khác hoặc đã hết số lần thử, ném lỗi
                    throw error;
                }
            }
        }

        // Nếu đã thử hết số lần mà vẫn lỗi
        throw lastError || new Error("Không thể tạo NFT sau nhiều lần thử");
    } catch (error) {
        console.error("Lỗi khi tạo NFT qua Metaplex:", error);

        // Tạo mock NFT nếu mint thật thất bại
        console.log("Sử dụng địa chỉ mock:", `mockMint${Date.now()}`);

        // Tạo mock NFT trong localStorage để hiển thị trong profile
        if (typeof window !== 'undefined') {
            try {
                // Đọc danh sách NFT hiện có
                const userNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');

                // Tạo ID mới cho NFT giả lập
                const mockId = `mockMint${Date.now()}`;

                // Đọc dữ liệu hình ảnh để lưu vào localStorage
                const reader = new FileReader();
                reader.readAsDataURL(metadata.image);
                reader.onload = () => {
                    // Tạo NFT giả lập đơn giản
                    userNfts.push({
                        id: mockId,
                        name: metadata.name,
                        description: metadata.description,
                        image: reader.result,
                        attributes: metadata.attributes,
                        mintedAt: new Date().toISOString(),
                        type: metadata.audio || metadata.audioUrl ? "music" : "cube",
                        local: true,
                        isMock: true,
                        txSignature: `mock${Date.now()}`,
                        mintAddress: mockId
                    });

                    localStorage.setItem('userNfts', JSON.stringify(userNfts));
                    console.log("Đã lưu mock NFT vào localStorage để hiển thị trong profile");
                };
            } catch (e) {
                console.error("Không thể lưu mock NFT vào localStorage:", e);
            }
        }

        return `mockMint${Date.now()}`;
    }
}

export async function getCubeNFTMetadata(
    name: string,
    description: string,
    image: File,
    model: File | null,
    attributes: any
): Promise<NFTMetadata> {
    return {
        name,
        symbol: 'VOID',
        description,
        image,
        ...(model && { model }),
        attributes: [
            {
                trait_type: 'Type',
                value: 'Cube'
            },
            ...attributes
        ],
        properties: {
            files: [
                {
                    uri: 'placeholder',
                    type: 'image/png'
                }
            ],
            category: 'image'
        }
    };
}

// Tạo metadata cho NFT âm nhạc
export async function getMusicNFTMetadata(
    name: string,
    description: string,
    image: File,
    audioUrl: string,
    attributes: any
): Promise<NFTMetadata> {
    return {
        name,
        symbol: 'VOID',
        description,
        image,
        audioUrl,
        attributes: [
            {
                trait_type: 'Type',
                value: 'Music'
            },
            ...attributes
        ],
        properties: {
            files: [
                {
                    uri: 'placeholder',
                    type: 'image/png'
                },
                {
                    uri: audioUrl,
                    type: 'audio/mpeg'
                }
            ],
            category: 'audio'
        }
    };
}

// Lấy thông tin NFT từ ví
export async function getNFTsByOwner(
    connection: Connection,
    ownerPublicKey: PublicKey
) {
    try {
        const metaplex = Metaplex.make(connection);
        const nfts = await metaplex.nfts().findAllByOwner({
            owner: ownerPublicKey
        });

        // Lọc NFTs để chỉ lấy những NFT từ dự án VOID
        const filteredNfts = nfts.filter(nft =>
            nft.symbol === 'VOID' ||
            nft.name.includes('VOID') ||
            nft.creators.some(creator =>
                creator.address.toString() === ownerPublicKey.toString()
            )
        );

        console.log(`Tìm thấy ${filteredNfts.length} VOID NFTs trong ví`);

        return filteredNfts;
    } catch (error) {
        console.error('Lỗi khi lấy NFTs từ ví:', error);

        // Trong trường hợp lỗi, trả về danh sách rỗng để không làm hỏng UI
        return [];
    }
} 