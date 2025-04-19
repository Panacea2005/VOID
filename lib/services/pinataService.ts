import axios from 'axios';

interface PinataResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
}

// Thêm khóa Gateway Pinata
const PINATA_GATEWAY_KEY = 'zPX2jQmb6hzuW-WQoLbFmduxvXlpFp1x0DXAEwFbmlEKEd1kk-2Omp_K9j1-mJmf';

// Thêm backup API endpoint khi Pinata thất bại
const BACKUP_PINATA_API = 'https://void-pinata-proxy.vercel.app/api/pinata';
let USE_BACKUP_API = false;

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
            console.log("Gateway Key:", PINATA_GATEWAY_KEY ? "✓ Có" : "✗ Không có");
            console.log("Sử dụng Backup API:", USE_BACKUP_API ? "✓ Có" : "✗ Không");

            if (!process.env.NEXT_PUBLIC_PINATA_API_KEY || !process.env.NEXT_PUBLIC_PINATA_SECRET_KEY) {
                throw new Error('Thiếu Pinata API key hoặc Secret key');
            }

            // Xác định loại file để có xử lý đặc biệt
            const isGLBFile = file.type === 'model/gltf-binary' || file.name.endsWith('.glb');
            const isPNGFile = file.type === 'image/png' || file.name.endsWith('.png');
            const isJPGFile = file.type === 'image/jpeg' || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg');
            const isJSONFile = file.type === 'application/json' || file.name.endsWith('.json');
            const isAudioFile = file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav');

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

            // Xử lý file âm thanh nếu cần
            if (isAudioFile) {
                console.log("Phát hiện file âm thanh, đảm bảo đúng MIME type");
                const audioType = file.name.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav';
                if (file.type !== audioType) {
                    const audioBlob = new Blob([await file.arrayBuffer()], { type: audioType });
                    file = new File([audioBlob], file.name, {
                        type: audioType,
                        lastModified: Date.now()
                    });
                    console.log("Đã sửa MIME type cho file âm thanh:", file.type);
                }
            }

            // Tạo dữ liệu để upload trực tiếp thông qua axios
            const formData = new FormData();
            formData.append('file', file);

            // Chuẩn bị metadata đơn giản hóa
            const pinataMetadata: {
                name: string,
                keyvalues: {
                    description: string,
                    fileType: string,
                    fileSize: number,
                    attributes?: string
                }
            } = {
                name: metadata.name || file.name,
                keyvalues: {
                    description: metadata.description || '',
                    fileType: file.type,
                    fileSize: file.size
                }
            };

            // Thêm thuộc tính nếu có
            if (metadata.attributes) {
                pinataMetadata.keyvalues.attributes = JSON.stringify(metadata.attributes);
            }

            formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

            // Tùy chọn đơn giản để tránh lỗi
            const pinataOptions = {
                cidVersion: 0
            };
            formData.append('pinataOptions', JSON.stringify(pinataOptions));

            console.log("Đang gửi request tới Pinata API...");

            // Xác định URL API dựa vào trạng thái sử dụng backup
            const pinataUrl = USE_BACKUP_API
                ? BACKUP_PINATA_API
                : 'https://api.pinata.cloud/pinning/pinFileToIPFS';

            try {
                // Sử dụng axios thay vì fetch để xử lý đúng multipart/form-data
                const response = await axios.post(pinataUrl, formData, {
                    maxBodyLength: Infinity,
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${(formData as any)._boundary}`,
                        'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY!,
                        'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!
                    }
                });

                console.log("File đã được pin thành công:", response.data);
                const fileHash = response.data.IpfsHash;

                // Đặt lại USE_BACKUP_API nếu đã sử dụng thành công API chính
                if (!USE_BACKUP_API) {
                    USE_BACKUP_API = false;
                }

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

                // Nếu là file âm thanh, bổ sung thông tin audio
                if (isAudioFile) {
                    metadataWithImage.audio = `ipfs://${fileHash}`;
                    metadataWithImage.animation_url = `ipfs://${fileHash}`;
                    metadataWithImage.properties = {
                        ...metadataWithImage.properties,
                        audio_type: file.type,
                        files: [
                            {
                                uri: `ipfs://${fileHash}`,
                                type: file.type,
                                cdn: getIpfsUrl(fileHash)
                            }
                        ]
                    };
                }

                console.log("Đang upload metadata lên Pinata...", metadataWithImage);

                // Sử dụng axios để upload JSON thay vì fetch
                const metadataResponse = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadataWithImage, {
                    headers: {
                        'Content-Type': 'application/json',
                        'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY!,
                        'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!
                    }
                });

                console.log("Metadata đã được upload thành công:", metadataResponse.data);

                // Trả về hash của file, không phải của metadata
                return fileHash;
            } catch (apiError) {
                console.error("Lỗi khi gọi API Pinata trực tiếp:", apiError);

                // Nếu chưa dùng backup API, thử chuyển sang dùng nó
                if (!USE_BACKUP_API) {
                    console.log("Chuyển sang sử dụng Backup API...");
                    USE_BACKUP_API = true;
                    // Không tăng số lần thử, chỉ thử lại với API khác
                    continue;
                } else {
                    // Nếu đã dùng backup API mà vẫn lỗi, ném lỗi để xử lý retry
                    throw apiError;
                }
            }
        } catch (error) {
            attempt++;
            console.error(`Lỗi khi upload lên Pinata (lần thử ${attempt}/${retries}):`, error);

            if (attempt >= retries) {
                console.error("Đã hết số lần thử. Không thể upload lên Pinata.");
                throw new Error(`Không thể upload lên Pinata sau ${retries} lần thử: ${error instanceof Error ? error.message : String(error)}`);
            }

            // Đợi trước khi thử lại
            await delay(retryDelay);
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

    // Tạo mảng URLs từ nhiều gateway khác nhau để tăng khả năng truy cập
    const gatewayUrls = [
        `https://ipfs.filebase.io/ipfs/${hash}`, // Filebase thường ổn định và ít giới hạn request hơn
        `https://nftstorage.link/ipfs/${hash}`, // NFT.Storage gateway - không có giới hạn request
        `https://gateway.pinata.cloud/ipfs/${hash}${PINATA_GATEWAY_KEY ? `?pinataGatewayToken=${PINATA_GATEWAY_KEY}` : ''}`, // Pinata với API key nếu có
        `https://cloudflare-ipfs.com/ipfs/${hash}`, // Cloudflare IPFS - ổn định và không giới hạn
        `https://dweb.link/ipfs/${hash}`, // Protocol Labs gateway - thay thế cho ipfs.io
        `https://ipfs.io/ipfs/${hash}`, // IPFS.io - có thể gặp giới hạn request
        `https://ipfs.4everland.io/ipfs/${hash}`, // 4everland gateway
        `https://w3s.link/ipfs/${hash}`, // Web3.Storage gateway
        `https://ipfs.eth.aragon.network/ipfs/${hash}`, // Aragon IPFS gateway
        `https://hardbin.com/ipfs/${hash}`, // Hardbin gateway
        `/api/ipfs/${hash}` // Local API endpoint cho backup
    ];

    // Lưu URLs vào localStorage để frontend có thể thử lần lượt nếu một gateway bị lỗi
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(`ipfs_gateways_${hash}`, JSON.stringify(gatewayUrls));
        } catch (e) {
            console.error("Không thể lưu IPFS gateways vào localStorage:", e);
        }
    }

    // Trả về URL đầu tiên (ưu tiên) nhưng frontend sẽ thử các URL khác nếu gặp lỗi
    console.log("IPFS URLs dự phòng:", gatewayUrls);
    return gatewayUrls[0];
}

// Thêm hàm mới trả về gateway URL cho GLB model 3D
export function getModelViewerUrl(hash: string): string {
    // Nếu hash bắt đầu bằng ipfs://, lấy phần hash
    if (hash.startsWith('ipfs://')) {
        hash = hash.substring(7);
    }

    // Sử dụng Pinata Gateway với API key để tối ưu tốc độ
    let modelUrl;
    if (PINATA_GATEWAY_KEY) {
        modelUrl = `https://gateway.pinata.cloud/ipfs/${hash}?pinataGatewayToken=${PINATA_GATEWAY_KEY}`;
    } else {
        modelUrl = `https://ipfs.io/ipfs/${hash}`;
    }

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

    // Sử dụng Pinata Gateway với API key để tối ưu tốc độ
    if (PINATA_GATEWAY_KEY) {
        return `https://gateway.pinata.cloud/ipfs/${hash}?pinataGatewayToken=${PINATA_GATEWAY_KEY}`;
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