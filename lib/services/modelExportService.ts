// modelExportService.ts - Enhanced version
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Enhanced to properly handle material parameters and texture patterns
export async function createCube(colors: string[], materialParams?: any): Promise<ArrayBuffer> {
    console.log("Creating 3D model with colors and materials:", colors, materialParams);
    
    // Ensure we have at least one color
    const baseColor = colors[0] || "#ffffff";
    
    // Create scene
    const scene = new THREE.Scene();
    
    // Use higher quality geometry with more segments for better detail
    const geometry = new THREE.BoxGeometry(2, 2, 2, 64, 64, 64);
    
    // Determine if we should use a single material or multiple materials
    let cube: THREE.Mesh;
    
    if (materialParams?.gradientColors || materialParams?.texturePattern || 
        materialParams?.customEffects?.includes('hologram') || 
        materialParams?.animationType === 'flow') {
        // For special effects like gradient, hologram, and flow - use a single material
        const material = createSpecialMaterial(baseColor, materialParams);
        cube = new THREE.Mesh(geometry, material);
    } else {
        // Create an array of materials, one for each face with slight variations
        const materials = createFaceMaterials(colors, materialParams);
        cube = new THREE.Mesh(geometry, materials);
    }
    
    // Store material parameters in userData for easy retrieval
    cube.userData = {
        colors: colors,
        primaryColor: baseColor,
        materialParams: materialParams ? JSON.parse(JSON.stringify(materialParams)) : null,
        // Add texture and animation data if available
        texture: materialParams?.texturePattern || 'default',
        animation: materialParams?.animationType || 'none',
        // Add a mesh name for easier identification
        meshName: "VOID_Cube"
    };
    
    // Add name to the mesh
    cube.name = "VOID_Cube";
    
    scene.add(cube);

    // Add better lighting for more visible results
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add point light to highlight cube edges
    const pointLight = new THREE.PointLight(0xffffff, 1.0);
    pointLight.position.set(-3, 2, 5);
    scene.add(pointLight);
    
    // Add a second point light from another angle
    const pointLight2 = new THREE.PointLight(0xffffff, 0.8);
    pointLight2.position.set(3, -2, -5);
    scene.add(pointLight2);

    // If the cube has a border/wireframe, add it
    if (materialParams?.showBorder) {
        addWireframe(cube, materialParams);
    }

    // Export with proper error handling and timeout
    return new Promise((resolve, reject) => {
        try {
            const exporter = new GLTFExporter();
            
            // Set a timeout to avoid hanging
            const timeoutId = setTimeout(() => {
                reject(new Error("GLB export timeout - took too long"));
            }, 15000);
            
            exporter.parse(
                scene,
                (result) => {
                    clearTimeout(timeoutId);
                    
                    if (result instanceof ArrayBuffer) {
                        const size = result.byteLength;
                        console.log(`Exported GLB binary with size: ${size} bytes`);
                        
                        if (size < 100) {
                            console.error("Exported GLB is too small, likely invalid");
                            reject(new Error("Exported GLB is too small (< 100 bytes)"));
                            return;
                        }
                        
                        resolve(result);
                    } else {
                        console.log("Received JSON output instead of binary, converting...");
                        // Handle JSON result (should be rare)
                        const output = JSON.stringify(result);
                        const blob = new Blob([output], { type: 'application/json' });
                        const reader = new FileReader();
                        reader.readAsArrayBuffer(blob);
                        reader.onloadend = () => {
                            clearTimeout(timeoutId);
                            if (reader.result) {
                                resolve(reader.result as ArrayBuffer);
                            } else {
                                reject(new Error("Failed to convert to ArrayBuffer"));
                            }
                        };
                        reader.onerror = (error) => {
                            clearTimeout(timeoutId);
                            reject(error);
                        };
                    }
                },
                (error) => {
                    clearTimeout(timeoutId);
                    console.error("GLTFExporter parse error:", error);
                    reject(error);
                },
                {
                    binary: true,
                    animations: [],
                    onlyVisible: true,
                    embedImages: true,
                    includeCustomExtensions: true,
                    forceIndices: true  // Ensure indices are included for better model quality
                }
            );
        } catch (error) {
            console.error("Exception in GLTFExporter:", error);
            reject(error);
        }
    });
}

// Create materials for each face with variations
function createFaceMaterials(colors: string[], materialParams?: any): THREE.Material[] {
    // Ensure we have 6 colors (one for each face)
    const faceColors = [...colors];
    while (faceColors.length < 6) {
        faceColors.push(faceColors[faceColors.length - 1] || "#FFFFFF");
    }
    
    // Create an array of materials, one for each face
    const materials = faceColors.map((color, index) => {
        // Use material parameters if provided, otherwise use defaults
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(color),
            roughness: materialParams?.roughness ?? 0.5,
            metalness: materialParams?.metalness ?? 0.3,
            name: `cube_material_${index}`
        });
        
        // Apply emissive properties if specified
        if (materialParams?.emissiveIntensity > 0) {
            material.emissive = new THREE.Color(materialParams.emissive || color);
            material.emissiveIntensity = materialParams.emissiveIntensity;
        }
        
        // Apply additional material properties if available
        if (materialParams?.transparent) {
            material.transparent = true;
            material.opacity = materialParams.opacity ?? 1.0;
        }
        
        if (materialParams?.clearcoat) {
            material.clearcoat = materialParams.clearcoat;
            material.clearcoatRoughness = materialParams.clearcoatRoughness ?? 0.1;
        }
        
        if (materialParams?.transmission) {
            material.transmission = materialParams.transmission;
            material.ior = materialParams.ior ?? 1.5;
        }
        
        if (materialParams?.sheen) {
            material.sheen = materialParams.sheen;
            material.sheenColor = new THREE.Color(materialParams.sheenColor || color);
            material.sheenRoughness = 0.3;
        }
        
        if (materialParams?.iridescence) {
            material.iridescence = materialParams.iridescence;
            material.iridescenceIOR = materialParams.iridescenceIOR ?? 1.5;
        }
        
        if (materialParams?.anisotropy) {
            material.anisotropy = materialParams.anisotropy;
        }
        
        return material;
    });
    
    return materials;
}

// Create special materials for effects like hologram, gradient, etc.
function createSpecialMaterial(baseColor: string, materialParams?: any): THREE.Material {
    if (materialParams?.customEffects?.includes('hologram')) {
        // For hologram, create a transparent material with emissive
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(baseColor),
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: materialParams.opacity ?? 0.7,
            transmission: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            emissive: new THREE.Color(materialParams.emissive || baseColor),
            emissiveIntensity: materialParams.emissiveIntensity ?? 1.0,
            iridescence: 1.0,
            iridescenceIOR: 1.5
        });
        return material;
    } 
    
    if (materialParams?.gradientColors && materialParams.gradientColors.length >= 2) {
        // For gradient, use the first two colors to create a customized material
        const color1 = new THREE.Color(materialParams.gradientColors[0]);
        const color2 = new THREE.Color(materialParams.gradientColors[1]);
        
        // Choose which is brighter to use as emissive
        const brightness1 = color1.r + color1.g + color1.b;
        const brightness2 = color2.r + color2.g + color2.b;
        const emissiveColor = brightness1 > brightness2 ? color1 : color2;
        
        // Create physical material with emissive
        const material = new THREE.MeshPhysicalMaterial({
            color: color1,
            roughness: materialParams.roughness ?? 0.3,
            metalness: materialParams.metalness ?? 0.7,
            emissive: emissiveColor,
            emissiveIntensity: materialParams.emissiveIntensity ?? 0.3,
            clearcoat: materialParams.clearcoat ?? 0.5,
            clearcoatRoughness: 0.1
        });
        
        return material;
    }
    
    if (materialParams?.texturePattern === 'plasma' || materialParams?.animationType === 'flow') {
        // For plasma or flow effects, create a material with high emissive and metalness
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(baseColor),
            roughness: materialParams.roughness ?? 0.4,
            metalness: materialParams.metalness ?? 0.8,
            emissive: new THREE.Color(materialParams.emissive || baseColor),
            emissiveIntensity: materialParams.emissiveIntensity ?? 1.0,
            clearcoat: 0.5,
            clearcoatRoughness: 0.1
        });
        return material;
    }
    
    if (materialParams?.texturePattern === 'nebula') {
        // For nebula effect, create a material with cosmic look
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(baseColor),
            roughness: materialParams.roughness ?? 0.5,
            metalness: materialParams.metalness ?? 0.7,
            emissive: new THREE.Color(materialParams.emissive || baseColor),
            emissiveIntensity: materialParams.emissiveIntensity ?? 0.8,
            clearcoat: 0.3,
            clearcoatRoughness: 0.2
        });
        return material;
    }
    
    if (materialParams?.texturePattern === 'carbon') {
        // For carbon fiber effect
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(baseColor),
            roughness: materialParams.roughness ?? 0.2,
            metalness: materialParams.metalness ?? 0.8,
            clearcoat: materialParams.clearcoat ?? 1.0,
            clearcoatRoughness: 0.1,
            anisotropy: 1.0
        });
        return material;
    }
    
    // Default material if no special effects
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(baseColor),
        roughness: materialParams?.roughness ?? 0.5,
        metalness: materialParams?.metalness ?? 0.5,
        emissive: materialParams?.emissive ? new THREE.Color(materialParams.emissive) : undefined,
        emissiveIntensity: materialParams?.emissiveIntensity ?? 0
    });
}

// Add wireframe to the cube
function addWireframe(cube: THREE.Mesh, materialParams?: any) {
    const wireframeGeometry = new THREE.EdgesGeometry(cube.geometry, 15);
    const wireframeMaterial = new THREE.LineBasicMaterial({
        color: materialParams?.borderColor || "#ffffff",
        linewidth: materialParams?.borderWidth || 2,
        transparent: true,
        opacity: 0.7
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframe.name = "VOID_Cube_Wireframe";
    cube.add(wireframe);
}

// Convert GLB to File object with enhanced error handling
export async function convertGLBToFile(colors: string[], name: string, materialParams?: any): Promise<File> {
    try {
        console.log("Starting to create 3D GLB model with colors and materials:", colors, materialParams);

        // Create cube with the specified colors AND material parameters
        const glbData = await createCube(colors, materialParams);

        // Check data size
        console.log(`GLB data size: ${glbData.byteLength} bytes`);

        if (glbData.byteLength <= 0) {
            throw new Error("Invalid or empty GLB data");
        }

        // Convert ArrayBuffer to Blob with correct MIME type
        const blob = new Blob([glbData], { type: 'model/gltf-binary' });

        // Create safe filename for URL
        const safeFileName = name
            .replace(/\s+/g, '-')
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .substring(0, 50);

        const fileName = `${safeFileName}-3d-model.glb`;

        // Create File object with full metadata
        const file = new File([blob], fileName, {
            type: 'model/gltf-binary',
            lastModified: Date.now()
        });

        console.log("Successfully created GLB file:", file.name, "size:", file.size, "bytes");
        return file;
    } catch (error) {
        console.error("Error creating GLB file:", error);
        
        // Create a simple fallback cube in case of error
        try {
            const simpleGLB = await createSimpleCube(colors[0] || "#0066ff");
            const blob = new Blob([simpleGLB], { type: 'model/gltf-binary' });
            const fileName = `${name.replace(/\s+/g, '-').toLowerCase()}-fallback.glb`;
            
            const file = new File([blob], fileName, { 
                type: 'model/gltf-binary',
                lastModified: Date.now()
            });
            console.log("Created fallback GLB file:", file.name, "size:", file.size, "bytes");
            return file;
        } catch (fallbackError) {
            console.error("Even fallback cube creation failed:", fallbackError);
            // Create an empty GLB file as absolute last resort
            const emptyGLB = new Uint8Array(256).buffer; // 256 byte empty buffer
            const blob = new Blob([emptyGLB], { type: 'model/gltf-binary' });
            return new File([blob], `${name.replace(/\s+/g, '-').toLowerCase()}-empty.glb`, { 
                type: 'model/gltf-binary' 
            });
        }
    }
}

// Create a simple colored cube fallback
async function createSimpleCube(color: string = "#0066ff"): Promise<ArrayBuffer> {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.5,
        metalness: 0.3,
        name: "simple_cube_material"
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.name = "VOID_Cube_Fallback";
    scene.add(cube);

    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

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

// Download GLB file directly (utility function)
export async function downloadGLBFile(colors: string[], name: string, materialParams?: any): Promise<void> {
    const glbFile = await convertGLBToFile(colors, name, materialParams);
    const url = URL.createObjectURL(glbFile);

    const link = document.createElement('a');
    link.href = url;
    link.download = glbFile.name;
    link.click();

    // Free up URL to avoid memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Create URL to view model
export function createModelViewerUrl(glbUrl: string): string {
    return `https://modelviewer.dev/editor/index.html#src=${encodeURIComponent(glbUrl)}`;
}

// Validate if file is a valid GLB
export async function validateGLBFile(file: File): Promise<{ valid: boolean, reason?: string }> {
    return new Promise((resolve) => {
        try {
            // Check by MIME type and extension
            const isNameGLB = file.name.toLowerCase().endsWith('.glb');
            const isMimeTypeGLB = file.type === 'model/gltf-binary';

            if (!isNameGLB && !isMimeTypeGLB) {
                return resolve({
                    valid: false,
                    reason: `File is not a GLB: name=${file.name}, type=${file.type}`
                });
            }

            // Check minimum size (valid GLB must be > 100 bytes)
            if (file.size < 100) {
                return resolve({
                    valid: false,
                    reason: `GLB file size is too small: ${file.size} bytes`
                });
            }

            // Read first 20 bytes to check GLB magic header
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const buffer = event.target?.result as ArrayBuffer;
                    if (!buffer) {
                        return resolve({ valid: false, reason: 'Cannot read file' });
                    }

                    // Check GLB magic header (must start with "glTF")
                    const header = new Uint8Array(buffer.slice(0, 4));
                    const magic = String.fromCharCode.apply(null, Array.from(header));

                    if (magic !== 'glTF') {
                        return resolve({
                            valid: false,
                            reason: `File is not a GLB: header=${magic}`
                        });
                    }

                    // Check version
                    const version = new Uint32Array(buffer.slice(4, 8))[0];
                    if (version !== 2) {
                        return resolve({
                            valid: false,
                            reason: `Unsupported GLB version: ${version}`
                        });
                    }

                    // If all checks passed, file is valid
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

            // Read first 20 bytes of file
            reader.readAsArrayBuffer(file.slice(0, 20));

        } catch (error) {
            resolve({
                valid: false,
                reason: `Error checking: ${error}`
            });
        }
    });
}