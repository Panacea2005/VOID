import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Metaplex, walletAdapterIdentity, NftWithToken, CreateNftInput } from '@metaplex-foundation/js';
import { uploadToPinata, getIpfsUrl, getDirectModelUrl, getModelViewerUrl } from './pinataService';

// Các thuộc tính metadata mở rộng để bao gồm cả thông tin collection
export interface ExtendedProperties {
    files: Array<{
        uri: string;
        type: string;
    }>;
    category: string;
    // Các thuộc tính tùy chỉnh cho collection
    [key: string]: any;
}

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
    properties: ExtendedProperties;
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

// ID tĩnh cho collections
const VOID_CUBE_COLLECTION_ID = "void-cube-collection";
const VOID_MUSIC_COLLECTION_ID = "void-music-collection";

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

        // Xác định loại NFT (music hoặc cube)
        const isMusic = !!audioUri;

        // Xác định collection dựa vào loại NFT
        const collectionName = isMusic ? "VOID Music Collection" : "VOID Cube Collection";
        const collectionSymbol = isMusic ? "VMUSIC" : "VOID";
        const collectionType = isMusic ? "audio" : "cube";
        const collectionId = isMusic ? VOID_MUSIC_COLLECTION_ID : VOID_CUBE_COLLECTION_ID;

        // Thêm thuộc tính collection vào attributes
        const collectionAttribute = {
            trait_type: 'Collection',
            value: collectionName
        };

        // Thêm vào danh sách attributes nếu chưa có
        const hasCollectionAttribute = metadata.attributes.some(attr => attr.trait_type === 'Collection');
        if (!hasCollectionAttribute) {
            metadata.attributes.push(collectionAttribute);
        }

        // Chuẩn bị metadata với cả ảnh và model
        const metadataWithFiles: any = {
            name: metadata.name,
            description: metadata.description,
            image: imageUri,
            attributes: metadata.attributes,
            collection: {
                name: collectionName,
                family: isMusic ? "VOID Music" : "VOID Cube",
            },
            properties: {
                files: [
                    {
                        uri: imageUri,
                        type: metadata.image.type || 'image/png',
                        cdn: getIpfsUrl(imageIpfsHash)
                    }
                ],
                category: isMusic ? 'audio' : 'image',
                collection: {
                    name: collectionName,
                    family: isMusic ? "VOID Music" : "VOID Cube",
                }
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

        // Số lần thử lại cho mint NFT
        let attemptCount = 0;
        const maxAttempts = 3;
        let mintedNftAddress = "";

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
                    symbol: isMusic ? 'VMUSIC' : 'VOID',
                    creators: [
                        {
                            address: wallet.publicKey,
                            share: 100,
                        },
                    ],
                    collection: null, // Tạm thời không sử dụng collection chính thức
                    tokenStandard: 0, // Non-Fungible Token standard
                    uses: null
                });

                console.log("NFT đã được tạo thành công:", nft.address.toString());
                console.log("Signature giao dịch:", response.signature);

                // Lưu lại địa chỉ của NFT
                mintedNftAddress = nft.address.toString();

                // Đã mint thành công, thoát vòng lặp
                break;
            } catch (error) {
                // Xử lý lỗi và quyết định có thử lại không
                console.error(`Lỗi khi mint NFT (lần thử ${attemptCount}/${maxAttempts}):`, error);

                // Nếu đã thử lại tối đa, ném lỗi
                if (attemptCount >= maxAttempts) {
                    console.error("Đã thử lại tối đa, không thể mint NFT");
                    throw error;
                }

                // Chờ một khoảng thời gian trước khi thử lại
                console.log("Chờ 2 giây trước khi thử lại...");
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Trả về địa chỉ của NFT đã mint
        return mintedNftAddress;
    } catch (error) {
        console.error("Lỗi trong quá trình mint NFT:", error);
        throw error;
    }
}

export async function getCubeNFTMetadata(
name: string, description: string, image: File, model: File | null, attributes: any, p0: { materialParams: any; colors: string[]; }): Promise<NFTMetadata> {
    // Thêm Collection attribute nếu chưa có
    const hasCollectionAttribute = attributes.some((attr: any) => attr.trait_type === 'Collection');
    const completeAttributes = hasCollectionAttribute ? attributes : [
        ...attributes,
        {
            trait_type: 'Collection',
            value: 'VOID Cube Collection'
        }
    ];

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
            ...completeAttributes
        ],
        properties: {
            files: [
                {
                    uri: 'placeholder',
                    type: 'image/png'
                }
            ],
            category: 'image',
            collection: {
                name: 'VOID Cube Collection',
                family: 'VOID Cube'
            }
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
    // Thêm Collection attribute nếu chưa có
    const hasCollectionAttribute = attributes.some((attr: any) => attr.trait_type === 'Collection');
    const completeAttributes = hasCollectionAttribute ? attributes : [
        ...attributes,
        {
            trait_type: 'Collection',
            value: 'VOID Music Collection'
        }
    ];

    return {
        name,
        symbol: 'VMUSIC',
        description,
        image,
        audioUrl,
        attributes: [
            {
                trait_type: 'Type',
                value: 'Music'
            },
            ...completeAttributes
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
            category: 'audio',
            collection: {
                name: 'VOID Music Collection',
                family: 'VOID Music'
            }
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