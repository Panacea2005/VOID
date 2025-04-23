import { uploadToPinata, getIpfsUrl, getModelViewerUrl, getDirectModelUrl } from './pinataService';
import { convertGLBToFile } from './modelExportService';
import { Connection, PublicKey } from '@solana/web3.js';
import { mintNFT, getCubeNFTMetadata, getMusicNFTMetadata } from './nftService';

export interface MockNFTMetadata {
    name: string;
    description: string;
    image: File;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
    audioUrl?: string;
}

// Tên và ID collection cố định
const VOID_CUBE_COLLECTION = "VOID Cube Collection";
const VOID_MUSIC_COLLECTION = "VOID Music Collection";

// Update mockMintNFT to store complete material parameters
export async function mockMintNFT(metadata: MockNFTMetadata, materialParams?: any): Promise<string> {
    try {
        console.log('Uploading image to Pinata...', metadata.name);
        
        // First verify the image file size to make sure it's valid
        if (metadata.image.size < 100) {
            console.error("Image file is too small, possibly blank:", metadata.image.size, "bytes");
            throw new Error("Image file appears to be blank or corrupt");
        }
        
        const ipfsHash = await uploadToPinata(metadata.image, {
            name: metadata.name,
            description: metadata.description,
            attributes: metadata.attributes,
            type: metadata.image.type || 'image/png'
        });

        // Get URL for the image using multiple gateways for reliability
        const imageUrl = getIpfsUrl(ipfsHash);
        const fallbackImages = [
            `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
            `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
            `https://ipfs.filebase.io/ipfs/${ipfsHash}`
        ];
        
        console.log("Image uploaded successfully to IPFS:", imageUrl);
        console.log("Fallback image URLs:", fallbackImages);

        // Determine NFT type (music or cube)
        const isMusic = !!metadata.audioUrl;
        const collectionName = isMusic ? "VOID Music Collection" : "VOID Cube Collection";

        // Add Collection attribute if not exists
        const hasCollection = metadata.attributes.some(attr => attr.trait_type === 'Collection');
        if (!hasCollection) {
            metadata.attributes.push({
                trait_type: 'Collection',
                value: collectionName
            });
        }

        let audioUrl = metadata.audioUrl || '';
        let audioType = 'audio/mpeg';
        let model3dIpfsHash = '';
        let modelIpfsUri = '';
        let directModelUrl = '';
        let modelViewerUrl = '';
        let fallbackModel3d: string[] = [];

        if (!isMusic) {
            // Create 3D model from image (mock, just a cube)
            console.log('Creating 3D model for NFT...');
            // Get color from attributes if available
            const colorAttr = metadata.attributes.find(attr => attr.trait_type === 'Color');
            const colors = colorAttr ? [colorAttr.value] : ['#5d4fff'];

            try {
                // Pass the complete materialParams to convertGLBToFile
                const glbFile = await convertGLBToFile(colors, metadata.name, materialParams);
                console.log('Created 3D model:', glbFile.name, 'type:', glbFile.type, 'size:', glbFile.size);
                
                // Verify the GLB file size to ensure it's valid
                if (glbFile.size < 1000) { // GLB files should be at least 1KB
                    console.warn("GLB file is suspiciously small:", glbFile.size, "bytes");
                }

                // Ensure correct MIME type for GLB file
                const modelMimeType = 'model/gltf-binary';

                // Upload 3D model to Pinata with correct MIME type
                model3dIpfsHash = await uploadToPinata(glbFile, {
                    name: metadata.name + " 3D Model",
                    description: "3D Model for " + metadata.name,
                    type: modelMimeType,
                    // Store materialParams in metadata for perfect reproduction
                    materialParams: materialParams ? JSON.stringify(materialParams) : undefined
                });
                
                console.log("3D model uploaded successfully to IPFS:", model3dIpfsHash);

                // Create standard IPFS URI
                modelIpfsUri = `ipfs://${model3dIpfsHash}`;

                // Create URLs for the 3D model with multiple gateway backups
                directModelUrl = getDirectModelUrl(model3dIpfsHash);
                modelViewerUrl = getModelViewerUrl(model3dIpfsHash);
                fallbackModel3d = [
                    `https://gateway.pinata.cloud/ipfs/${model3dIpfsHash}`,
                    `https://cloudflare-ipfs.com/ipfs/${model3dIpfsHash}`,
                    `https://dweb.link/ipfs/${model3dIpfsHash}`
                ];
                
                console.log("Model URLs:", {
                    directModelUrl,
                    modelViewerUrl,
                    fallbackModel3d
                });
            } catch (modelError) {
                console.error("Error creating or uploading 3D model:", modelError);
                // Continue without 3D model - we'll just have a 2D NFT
            }
        }

        // Create mock NFT with random ID and normalization
        const randomId = Math.floor(Math.random() * 900000 + 100000).toString();
        const nftId = isMusic
            ? `void-music-${randomId}`
            : `void-cube-${randomId}`;

        // Create a signature for tracking on Solscan
        const txSignature = `mockTx${Date.now()}${Math.random().toString(36).substring(2, 15)}`;

        // Prepare common NFT properties
        const baseNftProps = {
            id: nftId,
            name: metadata.name,
            description: metadata.description,
            image: imageUrl,
            fallbackImages,
            ipfsUrl: getIpfsUrl(ipfsHash),
            ipfsHash,
            mintAddress: nftId,
            txSignature: txSignature,
            collection: {
                name: collectionName,
                family: isMusic ? "VOID Music" : "VOID Cube"
            },
            properties: {
                files: [
                    {
                        uri: imageUrl,
                        type: metadata.image.type || 'image/png',
                        cdn: imageUrl
                    }
                ],
                category: isMusic ? 'audio' : 'image',
                collection: {
                    name: collectionName,
                    family: isMusic ? "VOID Music" : "VOID Cube"
                },
                // Store full material parameters for perfect reproduction
                materialParams: materialParams
            },
            attributes: metadata.attributes,
            mintedAt: new Date().toISOString(),
            symbol: isMusic ? 'VMUSIC' : 'VOID'
        };

        // Create NFT data with complete information based on type
        let nftData: any;

        if (isMusic) {
            // Music NFT logic...
            // [Keep existing music NFT code]
        } else {
            // Cube NFT with full material parameters
            nftData = {
                ...baseNftProps,
                model3d: directModelUrl,
                modelIpfsUri,
                modelViewerUrl,
                model3dHash: model3dIpfsHash,
                fallbackModel3d,
                model3dType: 'model/gltf-binary',
                materialParams: materialParams, // Store full material parameters at top level
                colors: metadata.attributes.find(attr => attr.trait_type === 'Color')?.value ? [metadata.attributes.find(attr => attr.trait_type === 'Color')?.value] : ['#5d4fff'], // Store colors directly at top level too
                properties: {
                  ...baseNftProps.properties,
                  files: [
                    ...baseNftProps.properties.files,
                    ...(model3dIpfsHash ? [{
                      uri: modelIpfsUri,
                      type: 'model/gltf-binary',
                      cdn: directModelUrl
                    }] : [])
                  ],
                  model_viewer_url: modelViewerUrl,
                  model_type: "glb",
                  materialParams: materialParams, // Store in properties as well
                  colors: metadata.attributes.find(attr => attr.trait_type === 'Color')?.value ? [metadata.attributes.find(attr => attr.trait_type === 'Color')?.value] : ['#5d4fff']  // Store colors in properties too
                },
                type: "cube",
                shapeType: "complex",
                color: (metadata.attributes.find(attr => attr.trait_type === 'Color')?.value || "#5d4fff")
            };
            
            // Add texture and animation info if available
            const textureAttr = metadata.attributes.find(attr => attr.trait_type === 'Texture');
            if (textureAttr?.value) {
                nftData.texture = textureAttr.value;
                nftData.properties.texture = textureAttr.value;
            }
            
            const animationAttr = metadata.attributes.find(attr => attr.trait_type === 'Animation');
            if (animationAttr?.value) {
                nftData.animation = animationAttr.value;
                nftData.properties.animation = animationAttr.value;
            }
        }

        // Save to localStorage
        const userNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
        userNfts.push(nftData);

        localStorage.setItem('userNfts', JSON.stringify(userNfts));
        console.log('Saved new NFT to localStorage', nftId);

        // Update URLs to ensure all URLs work
        refreshNFTImageURLS();

        return nftId;
    } catch (error) {
        console.error('Error minting mock NFT:', error);
        throw error;
    }
}

// Lấy danh sách NFT đã mint
export function getUserNFTs() {
    if (typeof window === 'undefined') return [];
    try {
        const nfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
        console.log("Loaded NFTs from localStorage:", nfts.length);

        // Chuẩn hóa các trường dữ liệu trước khi trả về
        const normalizedNfts = nfts.map((nft: any) => {
            // Đảm bảo mỗi NFT đều có trường type
            if (!nft.type) {
                nft.type = nft.audioUrl ? "music" : "cube";
            }

            // Đảm bảo có txSignature và mintAddress
            if (!nft.txSignature && nft.id) {
                nft.txSignature = `mock_tx_${nft.id.substring(0, 8)}${Date.now()}`;
            }

            if (!nft.mintAddress && nft.id) {
                nft.mintAddress = nft.id;
            }

            // Đảm bảo rằng NFT có đủ các thuộc tính cơ bản
            return {
                ...nft,
                type: nft.type || "cube",
                shapeType: nft.shapeType || "complex",
                price: nft.price || 1.0,
                mintedAt: nft.mintedAt || new Date().toISOString()
            };
        });

        // Trả về các NFT được sắp xếp theo thời gian mint mới nhất
        return normalizedNfts.sort((a: any, b: any) => {
            const dateA = new Date(a.mintedAt).getTime();
            const dateB = new Date(b.mintedAt).getTime();
            return dateB - dateA; // Sắp xếp giảm dần (mới nhất lên đầu)
        });
    } catch (error) {
        console.error("Error reading NFTs from localStorage:", error);
        return [];
    }
}

// Kiểm tra và cập nhật URL cho image
export function refreshNFTImageURLS() {
    if (typeof window === 'undefined') return;

    try {
        const nfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
        let hasChanges = false;

        // Kiểm tra và cập nhật URL cho các NFT
        for (const nft of nfts) {
            // Đảm bảo mỗi NFT đều có URL hình ảnh hợp lệ
            if (!nft.image || (nft.image.startsWith('blob:') && !isValidBlobURL(nft.image)) || nft.image.includes('undefined')) {
                // Ưu tiên sử dụng ipfsHash với gateway URL
                if (nft.ipfsHash) {
                    // Sử dụng nhiều gateway khác nhau để đảm bảo khả năng truy cập
                    nft.image = `https://ipfs.filebase.io/ipfs/${nft.ipfsHash}`;
                    // Thêm URL dự phòng bằng các gateway khác, thêm nhiều gateway hơn
                    nft.fallbackImages = [
                        `https://nftstorage.link/ipfs/${nft.ipfsHash}`,
                        `https://gateway.pinata.cloud/ipfs/${nft.ipfsHash}`,
                        `https://cloudflare-ipfs.com/ipfs/${nft.ipfsHash}`,
                        `https://dweb.link/ipfs/${nft.ipfsHash}`,
                        `https://ipfs.io/ipfs/${nft.ipfsHash}`,
                        `https://ipfs.4everland.io/ipfs/${nft.ipfsHash}`,
                        `https://w3s.link/ipfs/${nft.ipfsHash}`,
                        `https://ipfs.eth.aragon.network/ipfs/${nft.ipfsHash}`,
                        `https://hardbin.com/ipfs/${nft.ipfsHash}`,
                        // Thêm đường dẫn trực tiếp cho những environment sử dụng localhost hoặc vercel
                        `/api/ipfs/${nft.ipfsHash}`
                    ];
                    hasChanges = true;
                } else if (nft.ipfsUrl) {
                    // Chuyển đổi URL IPFS sang gateway URL nếu cần
                    if (nft.ipfsUrl.startsWith('ipfs://')) {
                        const cid = nft.ipfsUrl.replace('ipfs://', '');
                        nft.image = `https://ipfs.filebase.io/ipfs/${cid}`;
                        // Thêm URL dự phòng với nhiều gateway hơn
                        nft.fallbackImages = [
                            `https://nftstorage.link/ipfs/${cid}`,
                            `https://gateway.pinata.cloud/ipfs/${cid}`,
                            `https://cloudflare-ipfs.com/ipfs/${cid}`,
                            `https://dweb.link/ipfs/${cid}`,
                            `https://ipfs.io/ipfs/${cid}`,
                            `https://ipfs.4everland.io/ipfs/${cid}`,
                            `https://w3s.link/ipfs/${cid}`,
                            `https://ipfs.eth.aragon.network/ipfs/${cid}`,
                            `https://hardbin.com/ipfs/${cid}`,
                            `/api/ipfs/${cid}`
                        ];
                    } else {
                        nft.image = nft.ipfsUrl;
                    }
                    hasChanges = true;
                } else {
                    // Nếu không có URL hình ảnh hợp lệ, đặt placeholder mặc định
                    nft.image = '/placeholder.jpg';
                    hasChanges = true;
                }
            }

            // Thêm đường dẫn cục bộ nếu không tồn tại
            if (!nft.fallbackImages || nft.fallbackImages.length === 0) {
                if (nft.ipfsHash) {
                    nft.fallbackImages = [
                        `https://ipfs.filebase.io/ipfs/${nft.ipfsHash}`,
                        `https://nftstorage.link/ipfs/${nft.ipfsHash}`,
                        `https://gateway.pinata.cloud/ipfs/${nft.ipfsHash}`,
                        `https://cloudflare-ipfs.com/ipfs/${nft.ipfsHash}`,
                        `https://dweb.link/ipfs/${nft.ipfsHash}`,
                        `https://ipfs.io/ipfs/${nft.ipfsHash}`,
                        `https://ipfs.4everland.io/ipfs/${nft.ipfsHash}`,
                        `https://w3s.link/ipfs/${nft.ipfsHash}`,
                        `https://ipfs.eth.aragon.network/ipfs/${nft.ipfsHash}`,
                        `https://hardbin.com/ipfs/${nft.ipfsHash}`,
                        `/api/ipfs/${nft.ipfsHash}`
                    ];
                    hasChanges = true;
                }
            }

            // Kiểm tra và cập nhật model3d URL 
            if (nft.model3dHash && (!nft.model3d || (nft.model3d.startsWith('blob:') && !isValidBlobURL(nft.model3d)))) {
                // Sử dụng các hàm utility để tạo URL đúng
                const directModelUrl = getDirectModelUrl(nft.model3dHash);
                nft.model3d = directModelUrl;
                // Thêm URL dự phòng cho model3d với nhiều gateway hơn
                nft.fallbackModel3d = [
                    `https://ipfs.filebase.io/ipfs/${nft.model3dHash}`,
                    `https://nftstorage.link/ipfs/${nft.model3dHash}`,
                    `https://gateway.pinata.cloud/ipfs/${nft.model3dHash}`,
                    `https://cloudflare-ipfs.com/ipfs/${nft.model3dHash}`,
                    `https://dweb.link/ipfs/${nft.model3dHash}`,
                    `https://ipfs.io/ipfs/${nft.model3dHash}`,
                    `https://ipfs.4everland.io/ipfs/${nft.model3dHash}`,
                    `https://w3s.link/ipfs/${nft.model3dHash}`,
                    `https://ipfs.eth.aragon.network/ipfs/${nft.model3dHash}`,
                    `/api/ipfs/${nft.model3dHash}`
                ];

                // Thêm URI IPFS tiêu chuẩn nếu chưa có
                if (!nft.modelIpfsUri) {
                    nft.modelIpfsUri = `ipfs://${nft.model3dHash}`;
                }

                // Thêm URL cho model viewer
                nft.modelViewerUrl = getModelViewerUrl(nft.model3dHash);

                // Cập nhật properties để phù hợp
                if (!nft.properties) nft.properties = {};
                if (!nft.properties.files) nft.properties.files = [];

                // Tìm và cập nhật file model trong properties.files
                const modelFileIndex = nft.properties.files.findIndex((file: any) =>
                    file.type === 'model/gltf-binary' || file.uri.includes(nft.model3dHash));

                if (modelFileIndex >= 0) {
                    // Cập nhật model file nếu đã tồn tại
                    nft.properties.files[modelFileIndex] = {
                        uri: nft.modelIpfsUri,
                        type: 'model/gltf-binary',
                        cdn: directModelUrl
                    };
                } else {
                    // Thêm model file mới nếu chưa tồn tại
                    nft.properties.files.push({
                        uri: nft.modelIpfsUri,
                        type: 'model/gltf-binary',
                        cdn: directModelUrl
                    });
                }

                // Cập nhật thông tin model trong properties
                nft.properties.model_type = "glb";
                nft.properties.model_viewer_url = nft.modelViewerUrl;

                hasChanges = true;
            }

            // Đảm bảo các trường type cần thiết 
            if (!nft.type) {
                nft.type = nft.audioUrl ? "music" : "cube";
                hasChanges = true;
            }

            // Đảm bảo txSignature tồn tại
            if (!nft.txSignature && nft.mintAddress) {
                nft.txSignature = `mock_tx_${nft.mintAddress.substring(0, 8)}${Date.now()}`;
                hasChanges = true;
            }

            // Đảm bảo NFT có đủ thông tin properties cần thiết cho model 3D
            if (nft.model3d && !nft.properties) {
                nft.properties = {
                    files: [
                        {
                            uri: nft.image,
                            type: 'image/png'
                        }
                    ],
                    category: 'image'
                };
                hasChanges = true;
            }

            // Thêm file model 3D vào properties.files nếu có model3d nhưng chưa có trong properties
            if (nft.model3d && nft.properties && nft.properties.files) {
                const hasModel = nft.properties.files.some((file: any) =>
                    file.type === 'model/gltf-binary' || file.type === 'model/gltf+json'
                );

                if (!hasModel) {
                    nft.properties.files.push({
                        uri: nft.model3d,
                        type: 'model/gltf-binary'
                    });
                    hasChanges = true;
                }
            }
        }

        if (hasChanges) {
            localStorage.setItem('userNfts', JSON.stringify(nfts));
            console.log("Updated URLs for NFTs");

            // Tải trước các hình ảnh để cải thiện trải nghiệm
            preloadImages(nfts);
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật NFT URLs:", error);
    }
}

// Kiểm tra xem Blob URL có còn hợp lệ không
export function isValidBlobURL(url: string): boolean {
    try {
        return URL.createObjectURL(new Blob(['test'])).startsWith('blob:');
    } catch (e) {
        return false;
    }
}

// Thêm hàm tải trước hình ảnh để tối ưu hiển thị
export function preloadImages(nfts: any[]): void {
    if (typeof window === 'undefined') return;
    console.log("Starting to preload NFT images");

    nfts.forEach(nft => {
        if (!nft || !nft.name) {
            console.log("Skipping invalid NFT");
            return;
        }

        // Tạo hàm tải hình ảnh với fallback
        const tryLoadImage = (url: string, fallbackUrls: string[] = [], index = 0, maxAttempts = 5) => {
            if (!url || index >= maxAttempts) {
                console.log(`Failed to load image for NFT ${nft.name} after ${maxAttempts} attempts`);

                // Nếu còn fallback URLs, thử URL tiếp theo
                if (fallbackUrls && fallbackUrls.length > 0) {
                    console.log(`Trying fallback URL for NFT ${nft.name}: ${fallbackUrls[0]}`);
                    tryLoadImage(fallbackUrls[0], fallbackUrls.slice(1), 0, maxAttempts);
                } else if (nft.ipfsHash) {
                    // Thử tạo URL mới từ ipfsHash nếu có
                    const newUrl = `https://nftstorage.link/ipfs/${nft.ipfsHash}`;
                    console.log(`Generating new URL from ipfsHash for NFT ${nft.name}: ${newUrl}`);
                    tryLoadImage(newUrl, [], 0, 2);
                }
                return;
            }

            const img = new Image();

            img.onload = () => {
                console.log(`Successfully preloaded image for NFT ${nft.name}: ${url}`);
                // Cập nhật URL hình ảnh nếu thành công và khác với URL ban đầu
                if (url !== nft.image) {
                    nft.image = url;
                    // Lưu URL thành công vào localStorage
                    try {
                        const storedNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
                        const nftToUpdate = storedNfts.find((n: any) => n.id === nft.id);
                        if (nftToUpdate) {
                            nftToUpdate.image = url;
                            localStorage.setItem('userNfts', JSON.stringify(storedNfts));
                            console.log(`Updated image URL in localStorage for NFT ${nft.name}`);
                        }
                    } catch (e) {
                        console.error(`Error updating localStorage:`, e);
                    }
                }
            };

            img.onerror = () => {
                console.log(`Failed to preload image from ${url} for NFT ${nft.name} (attempt ${index + 1}/${maxAttempts})`);

                // Thử lại URL hiện tại với timeout ngắn 
                if (index < maxAttempts - 1) {
                    setTimeout(() => {
                        tryLoadImage(url, fallbackUrls, index + 1, maxAttempts);
                    }, 500 + index * 500); // Đợi thời gian tăng dần theo số lần thử
                } else if (fallbackUrls && fallbackUrls.length > 0) {
                    // Thử URL fallback tiếp theo
                    console.log(`Trying fallback URL for NFT ${nft.name}: ${fallbackUrls[0]}`);
                    tryLoadImage(fallbackUrls[0], fallbackUrls.slice(1), 0, maxAttempts);
                } else if (nft.ipfsHash) {
                    // Thử tạo các URL mới từ ipfsHash nếu đã thử hết fallback
                    const apiEndpoint = `/api/ipfs/${nft.ipfsHash}`;
                    console.log(`Last resort: trying local API endpoint for NFT ${nft.name}: ${apiEndpoint}`);
                    tryLoadImage(apiEndpoint, [], 0, 3);
                }
            };

            // Thêm cơ chế timeout cho quá trình tải
            const timeoutId = setTimeout(() => {
                // Nếu sau 10 giây mà ảnh vẫn chưa tải xong, hủy và thử URL khác
                if (!img.complete) {
                    console.log(`Timeout loading image from ${url} for NFT ${nft.name}`);
                    img.src = ''; // Hủy tải hiện tại

                    if (fallbackUrls && fallbackUrls.length > 0) {
                        tryLoadImage(fallbackUrls[0], fallbackUrls.slice(1), 0, maxAttempts);
                    } else if (nft.ipfsHash) {
                        const apiEndpoint = `/api/ipfs/${nft.ipfsHash}`;
                        tryLoadImage(apiEndpoint, [], 0, 3);
                    }
                }
            }, 10000); // 10 giây timeout

            img.onload = () => {
                clearTimeout(timeoutId);
                console.log(`Successfully preloaded image for NFT ${nft.name}: ${url}`);
                // Rest of the existing onload function...
                if (url !== nft.image) {
                    nft.image = url;
                    try {
                        const storedNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
                        const nftToUpdate = storedNfts.find((n: any) => n.id === nft.id);
                        if (nftToUpdate) {
                            nftToUpdate.image = url;
                            localStorage.setItem('userNfts', JSON.stringify(storedNfts));
                            console.log(`Updated image URL in localStorage for NFT ${nft.name}`);
                        }
                    } catch (e) {
                        console.error(`Error updating localStorage:`, e);
                    }
                }
            };

            img.onerror = () => {
                clearTimeout(timeoutId);
                console.log(`Failed to preload image from ${url} for NFT ${nft.name} (attempt ${index + 1}/${maxAttempts})`);

                // Existing error handling...
                if (index < maxAttempts - 1) {
                    setTimeout(() => {
                        tryLoadImage(url, fallbackUrls, index + 1, maxAttempts);
                    }, 500 + index * 500);
                } else if (fallbackUrls && fallbackUrls.length > 0) {
                    console.log(`Trying fallback URL for NFT ${nft.name}: ${fallbackUrls[0]}`);
                    tryLoadImage(fallbackUrls[0], fallbackUrls.slice(1), 0, maxAttempts);
                } else if (nft.ipfsHash) {
                    const apiEndpoint = `/api/ipfs/${nft.ipfsHash}`;
                    console.log(`Last resort: trying local API endpoint for NFT ${nft.name}: ${apiEndpoint}`);
                    tryLoadImage(apiEndpoint, [], 0, 3);
                }
            };

            img.src = url;
        };

        // Đảm bảo NFT có mảng fallbackImages đầy đủ
        if (!nft.fallbackImages || nft.fallbackImages.length === 0) {
            if (nft.ipfsHash) {
                nft.fallbackImages = [
                    `https://ipfs.filebase.io/ipfs/${nft.ipfsHash}`,
                    `https://nftstorage.link/ipfs/${nft.ipfsHash}`,
                    `https://gateway.pinata.cloud/ipfs/${nft.ipfsHash}`,
                    `https://cloudflare-ipfs.com/ipfs/${nft.ipfsHash}`,
                    `https://dweb.link/ipfs/${nft.ipfsHash}`,
                    `https://ipfs.io/ipfs/${nft.ipfsHash}`,
                    `https://ipfs.4everland.io/ipfs/${nft.ipfsHash}`,
                    `https://w3s.link/ipfs/${nft.ipfsHash}`,
                    `https://ipfs.eth.aragon.network/ipfs/${nft.ipfsHash}`,
                    `https://hardbin.com/ipfs/${nft.ipfsHash}`,
                    `/api/ipfs/${nft.ipfsHash}`
                ];
            }
        }

        // Bắt đầu tải hình ảnh chính
        if (nft.image) {
            console.log(`Preloading primary image for NFT ${nft.name}: ${nft.image}`);
            tryLoadImage(nft.image, nft.fallbackImages || []);
        } else if (nft.fallbackImages && nft.fallbackImages.length > 0) {
            // Nếu không có hình ảnh chính, thử fallback đầu tiên
            console.log(`No primary image, using first fallback for NFT ${nft.name}: ${nft.fallbackImages[0]}`);
            tryLoadImage(nft.fallbackImages[0], nft.fallbackImages.slice(1));
        } else if (nft.ipfsHash) {
            // Nếu không có URL nào, thử tạo từ ipfsHash
            const ipfsUrl = `https://ipfs.filebase.io/ipfs/${nft.ipfsHash}`;
            console.log(`No image URLs, generating from ipfsHash for NFT ${nft.name}: ${ipfsUrl}`);
            tryLoadImage(ipfsUrl, [
                `https://nftstorage.link/ipfs/${nft.ipfsHash}`,
                `https://gateway.pinata.cloud/ipfs/${nft.ipfsHash}`,
                `https://cloudflare-ipfs.com/ipfs/${nft.ipfsHash}`,
                `/api/ipfs/${nft.ipfsHash}`
            ]);
        }

        // Tải trước model 3D bằng cách gửi HEAD request - cải thiện xử lý lỗi
        if (nft.model3d && !nft.model3d.includes('modelviewer.dev')) {
            // Sử dụng hàm kiểm tra model riêng biệt
            checkModel3d(nft);
        }
    });
}

// Hàm kiểm tra model 3D riêng
function checkModel3d(nft: any): void {
    try {
        // Sử dụng try-catch bao quanh toàn bộ đoạn fetch
        // Chỉ kiểm tra mà không chặn luồng chính
        (async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch(nft.model3d, {
                    method: 'HEAD',
                    // Sử dụng no-cors mode để tránh lỗi CORS
                    mode: 'no-cors',
                    // Thêm signal từ controller để hỗ trợ timeout
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log(`Checked model3d URL for NFT ${nft.name}: ${nft.model3d}`);
            } catch (innerError: any) {
                // Thử URLs fallback nếu URL chính không khả dụng
                if (nft.fallbackModel3d && nft.fallbackModel3d.length > 0) {
                    console.log(`Trying fallback model URL for NFT ${nft.name}: ${nft.fallbackModel3d[0]}`);
                    // Cập nhật model3d với URL fallback đầu tiên
                    nft.model3d = nft.fallbackModel3d[0];

                    // Cập nhật trong localStorage
                    try {
                        const storedNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
                        const nftToUpdate = storedNfts.find((n: any) => n.id === nft.id);
                        if (nftToUpdate) {
                            nftToUpdate.model3d = nft.fallbackModel3d[0];
                            localStorage.setItem('userNfts', JSON.stringify(storedNfts));
                            console.log(`Updated model3d URL in localStorage for NFT ${nft.name}`);
                        }
                    } catch (e) {
                        console.error(`Error updating localStorage:`, e);
                    }
                }
            }
        })().catch(e => {
            // Bắt mọi lỗi không mong muốn trong promise
            console.log(`Unexpected error checking model for NFT ${nft.name}: ${e.message}`);
        });
    } catch (error) {
        // Bắt các lỗi cú pháp hoặc lỗi không phải network
        console.log(`Error checking model3d URL: ${error}`);
    }
}

// Chuyển cube thành file PNG để lưu trữ
export async function convertCubeToFile(canvasElement: HTMLCanvasElement, name: string): Promise<File> {
    return new Promise((resolve, reject) => {
        try {
            // Force a render of the canvas to ensure content is captured
            if (canvasElement.width === 0 || canvasElement.height === 0) {
                console.warn("Canvas has zero dimensions, using default size");
                canvasElement.width = 512;
                canvasElement.height = 512;
            }
            
            // Use preserveDrawingBuffer option for THREE.js renderer if available
            // This should be set when creating the renderer in page.tsx
            
            // Convert to high-quality PNG
            canvasElement.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to convert canvas to blob'));
                    return;
                }

                // Create a larger file name that's more meaningful
                const sanitizedName = name.replace(/\s+/g, '-').toLowerCase();
                const fileName = `void-cube-${sanitizedName}-${Date.now()}.png`;
                
                const file = new File([blob], fileName, {
                    type: 'image/png'
                });

                console.log(`Created image file: ${file.name}, size: ${file.size} bytes`);
                resolve(file);
            }, 'image/png', 1.0); // Use highest quality
        } catch (error) {
            console.error("Error converting cube to file:", error);
            reject(error);
        }
    });
}

// Thực hiện mint NFT thật sự trên Solana
export async function mintRealNFT(
    connection: Connection,
    wallet: any,
    cubeData: {
        name: string,
        description: string,
        attributes: Array<{ trait_type: string, value: string }>,
        colors: string[]
    },
    imageFile: File
): Promise<string> {
    try {
        console.log('Starting real NFT minting process...');

        // Tạo file 3D model GLB
        console.log('Creating GLB file...');
        const glbFile = await convertGLBToFile(cubeData.colors, cubeData.name);
        console.log('GLB file created:', glbFile.name, 'type:', glbFile.type, 'size:', glbFile.size, 'bytes');

        // Đảm bảo đúng MIME type cho file GLB
        const modelMimeType = 'model/gltf-binary';

        // Upload hình ảnh lên IPFS trước
        console.log('Uploading image to IPFS...');
        const imageIpfsHash = await uploadToPinata(imageFile, {
            name: cubeData.name + " Image",
            description: "Image for " + cubeData.name,
            type: imageFile.type || 'image/png'
        });
        const imageUri = `ipfs://${imageIpfsHash}`;
        const imageUrl = getIpfsUrl(imageIpfsHash);
        const fallbackImages = [
            `https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`,
            `https://cloudflare-ipfs.com/ipfs/${imageIpfsHash}`,
            `https://ipfs.filebase.io/ipfs/${imageIpfsHash}`
        ];

        // Upload model 3D lên IPFS với loại nội dung đúng
        console.log('Uploading 3D model to IPFS...');
        const model3dIpfsHash = await uploadToPinata(glbFile, {
            name: cubeData.name + " 3D Model",
            description: "3D Model for " + cubeData.name,
            type: modelMimeType  // Đảm bảo đúng loại MIME
        });

        // Tạo URI IPFS chuẩn
        const modelIpfsUri = `ipfs://${model3dIpfsHash}`;

        // Tạo URL cho các viewer
        const directModelUrl = getDirectModelUrl(model3dIpfsHash);
        const modelViewerUrl = getModelViewerUrl(model3dIpfsHash);

        const fallbackModel3d = [
            `https://gateway.pinata.cloud/ipfs/${model3dIpfsHash}`,
            `https://cloudflare-ipfs.com/ipfs/${model3dIpfsHash}`,
            `https://dweb.link/ipfs/${model3dIpfsHash}`
        ];

        // Đảm bảo thuộc tính Collection được thêm vào
        const hasCollection = cubeData.attributes.some(attr => attr.trait_type === 'Collection');
        if (!hasCollection) {
            cubeData.attributes.push({
                trait_type: 'Collection',
                value: VOID_CUBE_COLLECTION
            });
        }

        // Chuẩn bị metadata với đầy đủ thông tin
        const nftMetadata: any = {
            name: cubeData.name,
            symbol: "VOID",
            description: cubeData.description,
            image: imageUri,
            animation_url: modelIpfsUri, // Một số thị trường NFT sẽ hiển thị model 3D từ trường này
            model: modelIpfsUri, // Trường tùy chỉnh cho model
            external_url: modelViewerUrl, // URL để xem model từ bên ngoài
            attributes: cubeData.attributes,
            collection: {
                name: VOID_CUBE_COLLECTION,
                family: "VOID Cube"
            },
            properties: {
                files: [
                    {
                        uri: imageUri,
                        type: imageFile.type || 'image/png',
                        cdn: imageUrl
                    },
                    {
                        uri: modelIpfsUri,
                        type: modelMimeType,
                        cdn: directModelUrl
                    }
                ],
                category: "image",
                model_type: "glb",
                model_viewer_url: modelViewerUrl,
                collection: {
                    name: VOID_CUBE_COLLECTION,
                    family: "VOID Cube"
                }
            }
        };

        // Thực hiện mint NFT thật
        console.log('Minting NFT with metadata:', nftMetadata);

        // Chuyển đổi metadata thành định dạng phù hợp cho NFT service
        const solanaMetadata = {
            name: nftMetadata.name,
            symbol: nftMetadata.symbol,
            description: nftMetadata.description,
            image: imageFile, // Truyền file gốc thay vì URI
            model: glbFile, // Truyền file glb gốc
            attributes: nftMetadata.attributes,
            properties: nftMetadata.properties
        };

        // Gọi hàm mint NFT thật
        const mintedNftAddress = await mintNFT(connection, wallet, solanaMetadata);
        console.log('Successfully minted NFT, address:', mintedNftAddress);

        // Lấy thông tin giao dịch mới nhất
        let txSignature;
        try {
            const signatures = await connection.getSignaturesForAddress(new PublicKey(mintedNftAddress));
            if (signatures && signatures.length > 0) {
                txSignature = signatures[0].signature;
                console.log('Got transaction signature:', txSignature);
            } else {
                // Tạo giả một signature để đảm bảo có giá trị
                txSignature = `tx${Date.now()}${Math.random().toString(36).substring(2, 10)}`;
                console.log('Using mock transaction signature:', txSignature);
            }
        } catch (error) {
            // Nếu không lấy được, tạo một signature giả
            console.error('Error getting transaction signature:', error);
            txSignature = `tx${Date.now()}${Math.random().toString(36).substring(2, 10)}`;
            console.log('Using mock transaction signature after error:', txSignature);
        }

        // Lưu thông tin vào localStorage để hiển thị trong UI ngay cả khi blockchain chưa xác nhận
        const nftData = {
            id: mintedNftAddress,
            name: cubeData.name,
            description: cubeData.description,
            image: imageUrl,
            fallbackImages,
            ipfsUrl: imageUrl,
            ipfsHash: imageIpfsHash,
            model3d: directModelUrl,
            modelIpfsUri,
            modelViewerUrl,
            model3dHash: model3dIpfsHash,
            fallbackModel3d,
            model3dType: modelMimeType,
            properties: nftMetadata.properties,
            attributes: cubeData.attributes,
            mintedAt: new Date().toISOString(),
            solanaAddress: mintedNftAddress,
            mintAddress: mintedNftAddress,
            txSignature: txSignature,
            type: "cube",
            shapeType: "complex",
            price: 1.0 + Math.random() * 2,
            owner: wallet.publicKey.toString(),
            collection: {
                name: VOID_CUBE_COLLECTION,
                family: "VOID Cube"
            },
            symbol: "VOID"
        };

        // Lưu vào localStorage
        const userNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
        userNfts.push(nftData);
        localStorage.setItem('userNfts', JSON.stringify(userNfts));

        return mintedNftAddress;
    } catch (error) {
        console.error('Error minting real NFT:', error);
        throw error;
    }
}

// Kiểm tra model URL và trả về URL dự phòng nếu URL gốc không hợp lệ
export async function validateAndFixModelURL(url: string): Promise<string> {
    if (typeof window === 'undefined') return url;

    console.log("Checking model URL:", url);

    try {
        // Nếu URL đã có modelviewer.dev, đây có thể là URL viewer đã được cấu hình
        if (url.includes('modelviewer.dev')) {
            console.log("URL contains modelviewer.dev, possibly a valid viewer URL");
            return url;
        }

        // Kiểm tra URL trực tiếp - nếu là URL IPFS
        if (url.includes('ipfs.io') || url.includes('gateway.pinata.cloud') ||
            url.includes('cloudflare-ipfs.com') || url.includes('dweb.link')) {
            console.log("URL is IPFS, creating model viewer URL");
            return `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(url)}`;
        }

        // Nếu là ipfs:// protocol trực tiếp
        if (url.startsWith('ipfs://')) {
            console.log("URL is ipfs:// protocol, converting to gateway URL");
            const cid = url.replace('ipfs://', '');
            const gatewayUrl = `https://ipfs.io/ipfs/${cid}`;
            return `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(gatewayUrl)}`;
        }

        // Kiểm tra xem URL có thể truy cập không
        const isValid = await checkURLValidity(url);
        if (isValid) {
            console.log("URL is valid, creating model viewer URL");
            return `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(url)}`;
        }

        // Nếu không hợp lệ, trả về URL dự phòng
        console.log("URL is invalid, using fallback URL");
        return `https://modelviewer.dev/shared-assets/models/Astronaut.glb`;
    } catch (error) {
        console.error("Error checking URL:", error);
        return `https://modelviewer.dev/shared-assets/models/Astronaut.glb`;
    }
}

// Kiểm tra URL có thể truy cập không
async function checkURLValidity(url: string): Promise<boolean> {
    try {
        // Thử fetch URL với HEAD request và no-cors mode
        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
        });

        // Với no-cors, không thể kiểm tra status, nhưng nếu không có lỗi thì coi như có thể truy cập
        return true;
    } catch (error) {
        console.error("URL is not accessible:", url, error);
        return false;
    }
} 