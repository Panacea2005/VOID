import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Tạo một cube 3D đơn giản với các màu đã cho
export async function createCube(colors: string[]): Promise<ArrayBuffer> {
    console.log("Creating 3D model with colors:", colors);
    
    // Ensure we have 6 colors (one for each face)
    const faceColors = [...colors];
    while (faceColors.length < 6) {
        // If not enough colors provided, repeat the last one
        faceColors.push(faceColors[faceColors.length - 1] || "#FFFFFF");
    }
    
    // Create scene
    const scene = new THREE.Scene();

    // Create cube geometry
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    
    // Create an array of materials, one for each face
    const materials = faceColors.map((color, index) => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness: 0.5,
            metalness: 0.3,
            emissive: new THREE.Color(color).multiplyScalar(0.2),
            name: `cube_material_${index}`
        });
    });
    
    // Create a mesh with per-face materials
    const cube = new THREE.Mesh(geometry, materials);
    
    // Store color information in userData for easier retrieval later
    cube.userData = {
        colors: faceColors,
        primaryColor: faceColors[0]
    };
    
    scene.add(cube);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Export with proper error handling
    return new Promise((resolve, reject) => {
        try {
            const exporter = new GLTFExporter();
            exporter.parse(
                scene,
                (result) => {
                    if (result instanceof ArrayBuffer) {
                        console.log(`Exported GLB binary with size: ${result.byteLength} bytes`);
                        resolve(result);
                    } else {
                        // Handle JSON result (rare case)
                        console.log("Received JSON output instead of binary, converting...");
                        const output = JSON.stringify(result);
                        const blob = new Blob([output], { type: 'application/json' });
                        const reader = new FileReader();
                        reader.readAsArrayBuffer(blob);
                        reader.onloadend = () => {
                            if (reader.result) {
                                console.log(`Converted JSON to ArrayBuffer with size: ${(reader.result as ArrayBuffer).byteLength} bytes`);
                                resolve(reader.result as ArrayBuffer);
                            } else {
                                reject(new Error("Failed to convert to ArrayBuffer"));
                            }
                        };
                        reader.onerror = (error) => reject(error);
                    }
                },
                (error) => {
                    console.error("GLTFExporter parse error:", error);
                    reject(error);
                },
                {
                    binary: true,
                    // Include metadata in the exported file
                    animations: [],
                    onlyVisible: true,
                    embedImages: true,
                    includeCustomExtensions: true 
                }
            );
        } catch (error) {
            console.error("Exception in GLTFExporter:", error);
            reject(error);
        }
    });
}

// Chuyển đổi mảng các màu thành file GLB
export async function convertGLBToFile(colors: string[], name: string): Promise<File> {
    try {
        console.log("Bắt đầu tạo mô hình 3D GLB với màu:", colors);

        // Tạo cube với các màu đã chỉ định
        const glbData = await createCube(colors);

        // Kiểm tra kích thước dữ liệu
        console.log(`Kích thước dữ liệu GLB: ${glbData.byteLength} bytes`);

        if (glbData.byteLength <= 0) {
            throw new Error("Invalid or empty GLB data");
        }

        // Chuyển đổi ArrayBuffer thành Blob với MIME type đúng
        const blob = new Blob([glbData], { type: 'model/gltf-binary' });

        // Tạo tên file an toàn cho URL
        const safeFileName = name
            .replace(/\s+/g, '-')
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .substring(0, 50); // giới hạn độ dài

        const fileName = `${safeFileName}-3d-model.glb`;

        // Tạo File object với metadata đầy đủ
        const file = new File([blob], fileName, {
            type: 'model/gltf-binary',
            lastModified: Date.now()
        });

        console.log("Successfully created GLB file:", file.name, "size:", file.size, "bytes");
        return file;
    } catch (error) {
        console.error("Error creating GLB file:", error);
        // Tạo 1 cube đơn giản trong trường hợp lỗi
        const simpleGLB = await createSimpleCube();
        const blob = new Blob([simpleGLB], { type: 'model/gltf-binary' });
        const fileName = `${name.replace(/\s+/g, '-').toLowerCase()}-fallback.glb`;
        return new File([blob], fileName, { type: 'model/gltf-binary' });
    }
}

// Tạo một khối 3D đơn giản trong trường hợp có lỗi
async function createSimpleCube(): Promise<ArrayBuffer> {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
        color: 0x5d4fff,
        roughness: 0.5,
        metalness: 0.3,
        name: "simple_cube_material" // Add name to avoid undefined issues
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    return new Promise((resolve, reject) => {
        try {
            const exporter = new GLTFExporter();
            exporter.parse(
                scene,
                (result) => {
                    if (result instanceof ArrayBuffer) {
                        resolve(result);
                    } else {
                        const output = JSON.stringify(result);
                        const blob = new Blob([output], { type: 'application/json' });
                        const reader = new FileReader();
                        reader.readAsArrayBuffer(blob);
                        reader.onloadend = () => {
                            if (reader.result) {
                                resolve(reader.result as ArrayBuffer);
                            } else {
                                reject(new Error("Failed to convert to ArrayBuffer"));
                            }
                        };
                        reader.onerror = (error) => reject(error);
                    }
                },
                (error) => {
                    reject(error);
                },
                { binary: true }
            );
        } catch (error) {
            console.error("Exception in GLTFExporter for simple cube:", error);
            reject(error);
        }
    });
}

// Tạo và tải về file 3D model
export async function downloadGLBFile(colors: string[], name: string): Promise<void> {
    const glbFile = await convertGLBToFile(colors, name);
    const url = URL.createObjectURL(glbFile);

    const link = document.createElement('a');
    link.href = url;
    link.download = glbFile.name;
    link.click();

    // Giải phóng URL để tránh rò rỉ bộ nhớ
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Tạo URL để xem model
export function createModelViewerUrl(glbUrl: string): string {
    return `https://modelviewer.dev/editor/index.html#src=${encodeURIComponent(glbUrl)}`;
}

// Kiểm tra xem file có phải là GLB hợp lệ không
export async function validateGLBFile(file: File): Promise<{ valid: boolean, reason?: string }> {
    return new Promise((resolve) => {
        try {
            // Kiểm tra theo MIME type và phần mở rộng
            const isNameGLB = file.name.toLowerCase().endsWith('.glb');
            const isMimeTypeGLB = file.type === 'model/gltf-binary';

            if (!isNameGLB && !isMimeTypeGLB) {
                return resolve({
                    valid: false,
                    reason: `File is not a GLB: name=${file.name}, type=${file.type}`
                });
            }

            // Kiểm tra kích thước tối thiểu (GLB hợp lệ phải > 100 bytes)
            if (file.size < 100) {
                return resolve({
                    valid: false,
                    reason: `GLB file size is too small: ${file.size} bytes`
                });
            }

            // Đọc 20 bytes đầu tiên để kiểm tra magic number của GLB (header)
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const buffer = event.target?.result as ArrayBuffer;
                    if (!buffer) {
                        return resolve({ valid: false, reason: 'Không thể đọc file' });
                    }

                    // Kiểm tra magic header của GLB (phải bắt đầu với "glTF")
                    const header = new Uint8Array(buffer.slice(0, 4));
                    const magic = String.fromCharCode.apply(null, Array.from(header));

                    if (magic !== 'glTF') {
                        return resolve({
                            valid: false,
                            reason: `File is not a GLB: header=${magic}`
                        });
                    }

                    // Kiểm tra phiên bản
                    const version = new Uint32Array(buffer.slice(4, 8))[0];
                    if (version !== 2) {
                        return resolve({
                            valid: false,
                            reason: `Unsupported GLB version: ${version}`
                        });
                    }

                    // Nếu đã kiểm tra thành công, file được coi là hợp lệ
                    resolve({ valid: true });
                } catch (error) {
                    resolve({
                        valid: false,
                        reason: `Error checking file: ${error}`
                    });
                }
            };

            reader.onerror = () => {
                resolve({
                    valid: false,
                    reason: 'Cannot read file to check'
                });
            };

            // Đọc 20 bytes đầu tiên của file
            reader.readAsArrayBuffer(file.slice(0, 20));

        } catch (error) {
            resolve({
                valid: false,
                reason: `Error checking: ${error}`
            });
        }
    });
}

// Chuyển đổi file không phải GLB sang GLB (công cụ trợ giúp)
export async function convertToGLB(file: File, name?: string): Promise<File> {
    // Nếu file đã là GLB, trả về ngay
    const isGLB = file.name.toLowerCase().endsWith('.glb') || file.type === 'model/gltf-binary';
    if (isGLB) {
        // Vẫn cần đảm bảo loại MIME chính xác
        return new File([file], file.name, { type: 'model/gltf-binary' });
    }

    // Nếu là file GLTF, cần chuyển đổi nó thành GLB
    // Hiện tại chỉ hỗ trợ một số loại file cơ bản
    if (file.name.toLowerCase().endsWith('.gltf') || file.type === 'model/gltf+json') {
        console.warn("Conversion of GLTF to GLB is not supported. Please upload a GLB file directly.");

        // Trả về cube mặc định với màu ngẫu nhiên
        const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
        return convertGLBToFile([randomColor], name || file.name.replace('.gltf', ''));
    }

    // Với các định dạng không hỗ trợ, tạo cube mẫu
    console.warn(`Unsupported file type ${file.type} conversion to GLB. Creating a default cube.`);
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    return convertGLBToFile([randomColor], name || 'Converted Model');
} 