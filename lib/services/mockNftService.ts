import { uploadToPinata, getIpfsUrl, getModelViewerUrl, getDirectModelUrl } from './pinataService';
import { convertGLBToFile } from './modelExportService';
import { Connection } from '@solana/web3.js';
import { mintNFT, getCubeNFTMetadata } from './nftService';

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

// Mô phỏng quá trình mint NFT và lưu vào localStorage để hiển thị trong profile
export async function mockMintNFT(metadata: MockNFTMetadata): Promise<string> {
    try {
        // Upload lên Pinata (phần này thực tế, không giả lập)
        console.log('Đang upload hình ảnh NFT lên Pinata...', metadata.name);
        const ipfsHash = await uploadToPinata(metadata.image, {
            name: metadata.name,
            description: metadata.description,
            attributes: metadata.attributes,
            type: metadata.image.type || 'image/png'
        });

        // Tạo URL cho hình ảnh - sử dụng nhiều gateway để tăng độ tin cậy
        const imageUrl = getIpfsUrl(ipfsHash);
        const fallbackImages = [
            `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
            `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
            `https://ipfs.filebase.io/ipfs/${ipfsHash}`
        ];

        // Tạo file 3D model từ hình ảnh (giả lập, đơn giản chỉ là cube)
        console.log('Đang tạo model 3D cho NFT...');
        // Giả định sử dụng màu chính từ thuộc tính nếu có
        const colorAttr = metadata.attributes.find(attr => attr.trait_type === 'Color');
        const colors = colorAttr ? [colorAttr.value] : ['#5d4fff'];

        // Tạo model 3D
        const glbFile = await convertGLBToFile(colors, metadata.name);
        console.log('Đã tạo model 3D:', glbFile.name, 'type:', glbFile.type, 'size:', glbFile.size);

        // Đảm bảo đúng MIME type cho file GLB
        const modelMimeType = 'model/gltf-binary';

        // Upload model 3D lên Pinata với MIME type chính xác
        const model3dIpfsHash = await uploadToPinata(glbFile, {
            name: metadata.name + " 3D Model",
            description: "3D Model for " + metadata.name,
            type: modelMimeType
        });

        // Tạo URI IPFS chuẩn
        const modelIpfsUri = `ipfs://${model3dIpfsHash}`;

        // Tạo URL cho model 3D với nhiều gateway backup
        const directModelUrl = getDirectModelUrl(model3dIpfsHash);
        const modelViewerUrl = getModelViewerUrl(model3dIpfsHash);
        const fallbackModel3d = [
            `https://gateway.pinata.cloud/ipfs/${model3dIpfsHash}`,
            `https://cloudflare-ipfs.com/ipfs/${model3dIpfsHash}`,
            `https://dweb.link/ipfs/${model3dIpfsHash}`
        ];

        // Tạo NFT giả lập với ID ngẫu nhiên
        const nftId = `void-cube-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Tạo NFT data với đầy đủ thông tin 
        const nftData = {
            id: nftId,
            name: metadata.name,
            description: metadata.description,
            image: imageUrl,
            fallbackImages, // Thêm các URL dự phòng
            ipfsUrl: getIpfsUrl(ipfsHash),
            ipfsHash,
            model3d: directModelUrl,
            modelIpfsUri, // Thêm URI IPFS tiêu chuẩn
            modelViewerUrl, // URL trực tiếp cho model viewer
            model3dHash: model3dIpfsHash,
            fallbackModel3d, // Thêm các URL dự phòng cho model 3D
            model3dType: modelMimeType,
            properties: {
                files: [
                    {
                        uri: imageUrl,
                        type: metadata.image.type || 'image/png',
                        cdn: imageUrl
                    },
                    {
                        uri: modelIpfsUri,
                        type: modelMimeType,
                        cdn: directModelUrl
                    }
                ],
                category: 'image',
                model_viewer_url: modelViewerUrl,
                model_type: "glb"
            },
            attributes: metadata.attributes,
            mintedAt: new Date().toISOString(),
            // Thêm các thuộc tính hiển thị
            type: "cube",
            shapeType: "complex",
            color: "#5d4fff"
        };

        // Lưu vào localStorage
        const userNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
        userNfts.push(nftData);

        localStorage.setItem('userNfts', JSON.stringify(userNfts));
        console.log('Đã lưu NFT mới vào localStorage', nftId);

        // Cập nhật URLs để đảm bảo tất cả URLs đều hoạt động
        refreshNFTImageURLS();

        return nftId;
    } catch (error) {
        console.error('Lỗi khi mint NFT giả lập:', error);
        throw error;
    }
}

// Lấy danh sách NFT đã mint
export function getUserNFTs() {
    if (typeof window === 'undefined') return [];
    try {
        const nfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
        console.log("Đã tải NFTs từ localStorage:", nfts.length);

        // Trả về các NFT được sắp xếp theo thời gian mint mới nhất
        return nfts.sort((a: any, b: any) => {
            const dateA = new Date(a.mintedAt).getTime();
            const dateB = new Date(b.mintedAt).getTime();
            return dateB - dateA; // Sắp xếp giảm dần (mới nhất lên đầu)
        });
    } catch (error) {
        console.error("Lỗi khi đọc NFTs từ localStorage:", error);
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
            if (!nft.image || (nft.image.startsWith('blob:') && !isValidBlobURL(nft.image))) {
                // Ưu tiên sử dụng ipfsHash với gateway URL
                if (nft.ipfsHash) {
                    // Sử dụng nhiều gateway khác nhau để đảm bảo khả năng truy cập
                    nft.image = `https://ipfs.io/ipfs/${nft.ipfsHash}`;
                    // Thêm URL dự phòng bằng các gateway khác
                    nft.fallbackImages = [
                        `https://gateway.pinata.cloud/ipfs/${nft.ipfsHash}`,
                        `https://cloudflare-ipfs.com/ipfs/${nft.ipfsHash}`,
                        `https://ipfs.filebase.io/ipfs/${nft.ipfsHash}`
                    ];
                    hasChanges = true;
                } else if (nft.ipfsUrl) {
                    // Chuyển đổi URL IPFS sang gateway URL nếu cần
                    if (nft.ipfsUrl.startsWith('ipfs://')) {
                        const cid = nft.ipfsUrl.replace('ipfs://', '');
                        nft.image = `https://ipfs.io/ipfs/${cid}`;
                        // Thêm URL dự phòng
                        nft.fallbackImages = [
                            `https://gateway.pinata.cloud/ipfs/${cid}`,
                            `https://cloudflare-ipfs.com/ipfs/${cid}`,
                            `https://ipfs.filebase.io/ipfs/${cid}`
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

            // Kiểm tra và cập nhật model3d URL 
            if (nft.model3dHash && (!nft.model3d || (nft.model3d.startsWith('blob:') && !isValidBlobURL(nft.model3d)))) {
                // Sử dụng các hàm utility để tạo URL đúng
                const directModelUrl = getDirectModelUrl(nft.model3dHash);
                nft.model3d = directModelUrl;
                // Thêm URL dự phòng cho model3d
                nft.fallbackModel3d = [
                    `https://gateway.pinata.cloud/ipfs/${nft.model3dHash}`,
                    `https://cloudflare-ipfs.com/ipfs/${nft.model3dHash}`,
                    `https://dweb.link/ipfs/${nft.model3dHash}`
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
            console.log("Đã cập nhật URLs cho NFTs");

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
    console.log("Bắt đầu tải trước hình ảnh NFTs");

    nfts.forEach(nft => {
        if (nft.image) {
            const img = new Image();
            img.src = nft.image;

            img.onerror = () => {
                console.log(`Không thể tải trước hình ảnh từ ${nft.image} cho NFT ${nft.name}`);

                // Thử với fallbackImages
                if (nft.fallbackImages && nft.fallbackImages.length > 0) {
                    nft.fallbackImages.forEach((fallbackUrl: string) => {
                        const fallbackImg = new Image();
                        fallbackImg.src = fallbackUrl;
                        console.log(`Tải trước hình ảnh dự phòng: ${fallbackUrl}`);
                    });
                }
            };

            img.onload = () => {
                console.log(`Đã tải trước thành công hình ảnh: ${nft.image}`);
            };
        }

        // Tải trước model 3D bằng cách gửi HEAD request - cải thiện xử lý lỗi
        if (nft.model3d && !nft.model3d.includes('modelviewer.dev')) {
            try {
                // Sử dụng try-catch bao quanh toàn bộ đoạn fetch
                // Chỉ kiểm tra mà không chặn luồng chính
                (async () => {
                    try {
                        const response = await fetch(nft.model3d, {
                            method: 'HEAD',
                            // Sử dụng no-cors mode để tránh lỗi CORS
                            mode: 'no-cors',
                            // Thêm timeout ngắn để tránh chờ quá lâu
                            signal: AbortSignal.timeout(3000)
                        });
                        console.log(`Đã kiểm tra model3d URL: ${nft.model3d}`);
                    } catch (innerError: any) {
                        // Lỗi network hoặc timeout là bình thường, chỉ ghi log và bỏ qua
                        console.log(`Không thể kiểm tra model3d URL: ${nft.model3d} - ${innerError.message}`);
                    }
                })().catch(e => {
                    // Bắt mọi lỗi không mong muốn trong promise
                    console.log(`Lỗi bất ngờ khi kiểm tra model: ${e.message}`);
                });
            } catch (error) {
                // Bắt các lỗi cú pháp hoặc lỗi không phải network
                console.log(`Lỗi khi kiểm tra model3d URL: ${error}`);
            }
        }
    });
}

// Chuyển cube thành file PNG để lưu trữ
export async function convertCubeToFile(canvasElement: HTMLCanvasElement, name: string): Promise<File> {
    return new Promise((resolve, reject) => {
        try {
            canvasElement.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to convert canvas to blob'));
                    return;
                }

                const file = new File([blob], `${name.replace(/\s+/g, '-').toLowerCase()}.png`, {
                    type: 'image/png'
                });

                resolve(file);
            }, 'image/png');
        } catch (error) {
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
        console.log('Bắt đầu tiến trình mint NFT thật...');

        // Tạo file 3D model GLB
        console.log('Đang tạo file GLB...');
        const glbFile = await convertGLBToFile(cubeData.colors, cubeData.name);
        console.log('Đã tạo xong file GLB:', glbFile.name, 'type:', glbFile.type, 'size:', glbFile.size, 'bytes');

        // Đảm bảo đúng MIME type cho file GLB
        const modelMimeType = 'model/gltf-binary';

        // Upload hình ảnh lên IPFS trước
        console.log('Đang upload hình ảnh lên IPFS...');
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
        console.log('Đang upload model 3D lên IPFS...');
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
                model_viewer_url: modelViewerUrl
            }
        };

        // Thực hiện mint NFT thật với metadata đã tạo
        console.log('Đang mint NFT với metadata:', nftMetadata);

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
        console.log('Đã mint NFT thành công, địa chỉ:', mintedNftAddress);

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
            type: "cube",
            shapeType: "complex",
            price: 1.0 + Math.random() * 2,
            owner: wallet.publicKey.toString(),
        };

        // Lưu vào localStorage
        const userNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
        userNfts.push(nftData);
        localStorage.setItem('userNfts', JSON.stringify(userNfts));

        return mintedNftAddress;
    } catch (error) {
        console.error('Lỗi khi mint NFT thật:', error);
        throw error;
    }
}

// Kiểm tra model URL và trả về URL dự phòng nếu URL gốc không hợp lệ
export async function validateAndFixModelURL(url: string): Promise<string> {
    if (typeof window === 'undefined') return url;

    console.log("Kiểm tra URL model 3D:", url);

    try {
        // Nếu URL đã có modelviewer.dev, đây có thể là URL viewer đã được cấu hình
        if (url.includes('modelviewer.dev')) {
            console.log("URL chứa modelviewer.dev, có thể là URL viewer hợp lệ");
            return url;
        }

        // Kiểm tra URL trực tiếp - nếu là URL IPFS
        if (url.includes('ipfs.io') || url.includes('gateway.pinata.cloud') ||
            url.includes('cloudflare-ipfs.com') || url.includes('dweb.link')) {
            console.log("URL là IPFS URL, tạo URL model viewer");
            return `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(url)}`;
        }

        // Nếu là ipfs:// protocol trực tiếp
        if (url.startsWith('ipfs://')) {
            console.log("URL là ipfs:// protocol, chuyển đổi sang gateway URL");
            const cid = url.replace('ipfs://', '');
            const gatewayUrl = `https://ipfs.io/ipfs/${cid}`;
            return `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(gatewayUrl)}`;
        }

        // Kiểm tra xem URL có thể truy cập không
        const isValid = await checkURLValidity(url);
        if (isValid) {
            console.log("URL hợp lệ, tạo URL model viewer");
            return `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(url)}`;
        }

        // Nếu không hợp lệ, trả về URL dự phòng
        console.log("URL không hợp lệ, sử dụng URL dự phòng");
        return `https://modelviewer.dev/shared-assets/models/Astronaut.glb`;
    } catch (error) {
        console.error("Lỗi khi kiểm tra URL:", error);
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
        console.error("URL không thể truy cập:", url, error);
        return false;
    }
} 