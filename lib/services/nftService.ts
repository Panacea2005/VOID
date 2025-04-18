import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { uploadToPinata, getIpfsUrl, getDirectModelUrl, getModelViewerUrl } from './pinataService';

export interface NFTMetadata {
    name: string;
    symbol: string;
    description: string;
    image: File;
    model?: File;
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

export async function mintNFT(
    connection: Connection,
    wallet: any,
    metadata: NFTMetadata
): Promise<string> {
    try {
        // Tải ảnh lên Pinata trước
        const imageIpfsHash = await uploadToPinata(metadata.image, {
            name: `${metadata.name}-image`,
            description: metadata.description,
            type: metadata.image.type || 'image/png'
        });

        const imageUri = getIpfsUrl(imageIpfsHash);

        // Nếu có file 3D model, cũng tải lên Pinata
        let modelUri = '';
        let modelType = 'model/gltf-binary';
        if (metadata.model) {
            // Đảm bảo rằng file model có loại MIME chính xác
            const modelFile = metadata.model;
            // Kiểm tra nếu là file GLB
            const isGLB = modelFile.name.toLowerCase().endsWith('.glb') ||
                modelFile.type === 'model/gltf-binary';

            if (!isGLB) {
                console.log("Model không phải GLB, cần chuyển đổi trước khi upload");
                // Ở đây có thể gọi hàm để chuyển đổi model sang GLB nếu cần
                // Tạm thời giữ nguyên và tiếp tục upload
            }

            // Đặt đúng loại MIME cho file GLB
            modelType = 'model/gltf-binary';

            const modelIpfsHash = await uploadToPinata(modelFile, {
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

        // Tạo file metadata JSON
        const metadataBlob = new Blob([JSON.stringify(metadataWithFiles, null, 2)], { type: 'application/json' });
        const metadataFile = new File([metadataBlob], `${metadata.name.replace(/\s+/g, '-')}-metadata.json`, { type: 'application/json' });

        // Tải metadata lên Pinata
        const metadataIpfsHash = await uploadToPinata(metadataFile, {
            name: `${metadata.name}-metadata`,
            type: 'application/json'
        });
        const metadataUri = getIpfsUrl(metadataIpfsHash);

        // In ra thông tin chi tiết để debug
        console.log("NFT Metadata đã được upload:", {
            metadataUri,
            imageUri,
            modelUri,
            metadataFull: metadataWithFiles
        });

        // Khởi tạo Metaplex
        const metaplex = Metaplex.make(connection)
            .use(walletAdapterIdentity(wallet));

        // Tạo NFT
        const { nft } = await metaplex.nfts().create({
            uri: metadataUri,
            name: metadata.name,
            sellerFeeBasisPoints: 500, // 5% royalty
            symbol: metadata.symbol || 'VOID',
            creators: [
                {
                    address: wallet.publicKey,
                    share: 100,
                },
            ],
            isMutable: true,
        });

        return nft.address.toString();
    } catch (error) {
        console.error('Error minting NFT:', error);
        throw error;
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

        // Lọc NFTs để chỉ lấy những NFT từ dự án VOID (phát hiện qua symbol hoặc creator)
        return nfts.filter(nft =>
            nft.symbol === 'VOID' ||
            nft.name.includes('VOID') ||
            nft.creators.some(creator =>
                creator.address.toString() === ownerPublicKey.toString()
            )
        );
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        throw error;
    }
} 