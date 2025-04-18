import axios from 'axios';

interface PinataResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function uploadToPinata(file: File, metadata: any, retries = 3, retryDelay = 1000): Promise<string> {
    let attempt = 0;

    while (attempt < retries) {
        try {
            console.log(`Đang upload file lên Pinata... (lần thử ${attempt + 1}/${retries})`,
                file.name, file.type, file.size);
            console.log("API Key:", process.env.NEXT_PUBLIC_PINATA_API_KEY ? "✓ Có" : "✗ Không có");
            console.log("Secret Key:", process.env.NEXT_PUBLIC_PINATA_SECRET_KEY ? "✓ Có" : "✗ Không có");

            if (!process.env.NEXT_PUBLIC_PINATA_API_KEY || !process.env.NEXT_PUBLIC_PINATA_SECRET_KEY) {
                throw new Error('Thiếu Pinata API key hoặc Secret key');
            }

            // Upload file to IPFS via Pinata
            const formData = new FormData();

            // Xác định loại file để có xử lý đặc biệt
            const isGLBFile = file.type === 'model/gltf-binary' || file.name.endsWith('.glb');
            const isPNGFile = file.type === 'image/png' || file.name.endsWith('.png');
            const isJPGFile = file.type === 'image/jpeg' || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg');
            const isJSONFile = file.type === 'application/json' || file.name.endsWith('.json');

            // Với file GLB, cần đảm bảo đúng MIME type
            if (isGLBFile) {
                console.log("Phát hiện file GLB, đảm bảo đúng MIME type");

                // Tạo file mới với MIME type đúng nếu cần
                if (file.type !== 'model/gltf-binary') {
                    const glbBlob = new Blob([await file.arrayBuffer()], { type: 'model/gltf-binary' });
                    file = new File([glbBlob], file.name.endsWith('.glb') ? file.name : `${file.name}.glb`, {
                        type: 'model/gltf-binary',
                        lastModified: Date.now()
                    });
                    console.log("Đã sửa MIME type cho file GLB:", file.type);
                }
            }

            // Thêm file vào form data
            formData.append('file', file);

            // Thêm metadata cho file với thông tin đặc biệt cho model 3D
            const pinataMetadata: any = {
                name: metadata.name || file.name,
                keyvalues: {
                    description: metadata.description || '',
                    type: file.type,
                    fileSize: file.size,
                    lastModified: file.lastModified,
                    isGLB: isGLBFile,
                    isPNG: isPNGFile,
                    isJPG: isJPGFile,
                    isJSON: isJSONFile,
                    timestamp: Date.now()
                }
            };

            // Thêm các thuộc tính từ metadata nếu có
            if (metadata.attributes) {
                pinataMetadata.keyvalues.attributes = JSON.stringify(metadata.attributes);
            }

            // Nếu là file model, thêm thông tin đặc biệt
            if (isGLBFile) {
                pinataMetadata.keyvalues.modelType = 'glb';
                pinataMetadata.keyvalues.is3DModel = true;
                pinataMetadata.keyvalues.contentType = 'model/gltf-binary';
                pinataMetadata.keyvalues.category = '3d_model';
            }

            formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

            // Thêm các tùy chọn cho Pinata
            const pinataOptions = {
                cidVersion: 0,
                wrapWithDirectory: false  // Không bọc trong thư mục
            };
            formData.append('pinataOptions', JSON.stringify(pinataOptions));

            console.log("Đang gửi request tới Pinata API...");

            // Gửi file lên Pinata
            const fileResponse = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
                maxBodyLength: Infinity,
                headers: {
                    'Content-Type': `multipart/form-data`,
                    'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_KEY
                },
                timeout: 60000 // 60 giây timeout
            });

            console.log("File đã được pin thành công:", fileResponse.data);
            const fileHash = fileResponse.data.IpfsHash;

            // Nếu là file JSON, trả về hash trực tiếp
            if (isJSONFile) {
                return fileHash;
            }

            // Tạo metadata với thông tin đầy đủ
            const metadataWithImage: any = {
                name: metadata.name || file.name,
                description: metadata.description || '',
                image: `ipfs://${fileHash}`,
            };

            // Nếu có attributes, thêm vào
            if (metadata.attributes) {
                metadataWithImage.attributes = metadata.attributes;
            }

            // Thêm thông tin cơ bản
            metadataWithImage.properties = {
                files: [
                    {
                        uri: `ipfs://${fileHash}`,
                        type: file.type,
                        cdn: getIpfsUrl(fileHash)
                    }
                ]
            };

            // Nếu là file GLB, bổ sung thông tin model
            if (isGLBFile) {
                metadataWithImage.model = `ipfs://${fileHash}`;
                metadataWithImage.animation_url = `ipfs://${fileHash}`;
                metadataWithImage.model_url = `ipfs://${fileHash}`;
                metadataWithImage.properties = {
                    ...metadataWithImage.properties,
                    model_type: "glb",
                    model_viewer: getModelViewerUrl(fileHash),
                    files: [
                        {
                            uri: `ipfs://${fileHash}`,
                            type: "model/gltf-binary",
                            cdn: getIpfsUrl(fileHash)
                        }
                    ]
                };
            }

            console.log("Đang upload metadata lên Pinata...", metadataWithImage);

            const metadataResponse = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadataWithImage, {
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_KEY
                },
                timeout: 30000 // 30 giây timeout
            });

            console.log("Metadata đã được upload thành công:", metadataResponse.data);
            return fileHash; // Trả về hash của file, không phải của metadata
        } catch (error) {
            attempt++;
            console.error(`Lỗi khi upload lên Pinata (lần thử ${attempt}/${retries}):`, error);

            if (attempt >= retries) {
                console.error("Đã hết số lần thử. Không thể upload lên Pinata.");
                throw new Error(`Không thể upload lên Pinata sau ${retries} lần thử: ${error instanceof Error ? error.message : String(error)}`);
            }

            // Đợi trước khi thử lại
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            // Tăng thời gian chờ mỗi lần retry
            retryDelay *= 2;
        }
    }

    throw new Error('Không thể upload lên Pinata');
}

export function getIpfsUrl(hash: string): string {
    console.log("Tạo IPFS URL cho hash:", hash);

    // Nếu hash bắt đầu bằng ipfs://, lấy phần hash
    if (hash.startsWith('ipfs://')) {
        hash = hash.substring(7);
    }

    // Sử dụng nhiều IPFS gateway để tăng khả năng truy cập
    const gateways = [
        `https://ipfs.io/ipfs/${hash}`,
        `https://gateway.pinata.cloud/ipfs/${hash}`,
        `https://cloudflare-ipfs.com/ipfs/${hash}`,
        `https://dweb.link/ipfs/${hash}`,
        `https://ipfs.filebase.io/ipfs/${hash}`
    ];

    console.log("IPFS URLs:", gateways[0]); // Dùng ipfs.io làm mặc định vì ổn định
    return gateways[0];
}

// Thêm hàm mới trả về gateway URL cho GLB model 3D
export function getModelViewerUrl(hash: string): string {
    // Nếu hash bắt đầu bằng ipfs://, lấy phần hash
    if (hash.startsWith('ipfs://')) {
        hash = hash.substring(7);
    }

    // Sử dụng nhiều gateway cho model 3D để tăng khả năng tải
    const possibleGateways = [
        `https://ipfs.io/ipfs/${hash}`,
        `https://gateway.pinata.cloud/ipfs/${hash}`,
        `https://cloudflare-ipfs.com/ipfs/${hash}`,
        `https://dweb.link/ipfs/${hash}`
    ];

    // Chọn gateway ổn định nhất cho model 3D (ipfs.io)
    const modelUrl = possibleGateways[0];

    // Thêm các tham số để tối ưu hiển thị model
    // Sử dụng Model-Viewer v3.0+ với các tùy chọn nâng cao
    return `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(modelUrl)}&ar=true&autoplay=true&autoRotate=true&cameraControls=true&shadow-intensity=1.0`;
}

// Thêm hàm lấy URL trực tiếp cho model GLB
export function getDirectModelUrl(hash: string): string {
    // Nếu hash bắt đầu bằng ipfs://, lấy phần hash
    if (hash.startsWith('ipfs://')) {
        hash = hash.substring(7);
    }

    // Tạo mảng các gateway URL để thử
    const gatewayUrls = [
        `https://ipfs.io/ipfs/${hash}`,
        `https://gateway.pinata.cloud/ipfs/${hash}`,
        `https://cloudflare-ipfs.com/ipfs/${hash}`,
        `https://dweb.link/ipfs/${hash}`,
        `https://ipfs.filebase.io/ipfs/${hash}`
    ];

    // Trả về URL chính, frontend sẽ thử các URL khác nếu cần
    return gatewayUrls[0];
}

// Hàm mới: Trả về URL sử dụng Google's Model-viewer để hiển thị GLB
export function getGoogleModelViewerUrl(hash: string): string {
    const directUrl = getDirectModelUrl(hash);
    return `https://modelviewer.googleapis.com/v1.12.0/index.html#load=${encodeURIComponent(directUrl)}`;
}

// Hàm mới: Tạo HTML để nhúng model-viewer vào trang web
export function createModelViewerHTML(hash: string): string {
    const directUrl = getDirectModelUrl(hash);
    return `
    <model-viewer
      src="${directUrl}"
      alt="3D Model"
      auto-rotate
      camera-controls
      shadow-intensity="1"
      ar
      ar-modes="webxr scene-viewer quick-look"
      style="width: 100%; height: 500px;">
    </model-viewer>
    `;
} 