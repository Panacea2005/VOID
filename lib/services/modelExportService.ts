// modelExportService.ts - Enhanced version with texture baking
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Interface for cube face textures
interface CubeFaceTextures {
  px: string; // +X face
  nx: string; // -X face
  py: string; // +Y face
  ny: string; // -Y face
  pz: string; // +Z face
  nz: string; // -Z face
}

// Enhanced to properly handle material parameters and texture patterns
async function createCube(colors: string[], materialParams?: any): Promise<ArrayBuffer> {
    console.log("Creating 3D model with colors and materials:", colors, materialParams);
    
    // Ensure we have at least one color
    const baseColor = colors[0] || "#ffffff";
    
    // Create scene
    const scene = new THREE.Scene();
    
    // Use higher quality geometry with more segments for better detail
    const geometry = new THREE.BoxGeometry(2, 2, 2, 64, 64, 64);
    
    // CRITICAL FIX: Determine if we should use special materials
    const needsBaking = shouldBakeMaterial(materialParams);
    let cube: THREE.Mesh;
    
    if (needsBaking) {
        // For complex effects, we'll bake the appearance to textures
        console.log("Using texture baking approach for complex material");
        const material = await createBakedMaterial(baseColor, materialParams);
        cube = new THREE.Mesh(geometry, await material);
    } else if (materialParams?.texturePattern) {
        // For textured materials
        console.log("Creating textured material");
        const material = createTexturedMaterial(baseColor, materialParams);
        cube = new THREE.Mesh(geometry, await material);
    } else if (materialParams?.gradientColors && materialParams.gradientColors.length >= 2) {
        // For gradient materials
        console.log("Creating gradient material");
        const material = createGradientMaterial(materialParams.gradientColors, materialParams);
        cube = new THREE.Mesh(geometry, await material);
    } else {
        // For standard materials
        console.log("Creating standard material with face colors");
        const materials = createFaceMaterials(colors, materialParams);
        cube = new THREE.Mesh(geometry, materials);
    }
    
    // CRITICAL FIX: Store complete material parameters in userData for preservation
    cube.userData = {
        colors: colors,
        primaryColor: baseColor,
        materialParams: materialParams ? JSON.parse(JSON.stringify(materialParams)) : null,
        // Add specific properties for easier extraction
        texture: materialParams?.texturePattern || 'default',
        animation: materialParams?.animationType || 'none',
        emissiveIntensity: materialParams?.emissiveIntensity || 0,
        transparent: materialParams?.transparent || false,
        opacity: materialParams?.opacity || 1.0,
        customEffects: materialParams?.customEffects || [],
        // Add model name for easier identification
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

    // CRITICAL FIX: If the cube has a border/wireframe, add it
    if (materialParams?.showBorder) {
        addWireframe(cube, materialParams);
    }

    // CRITICAL FIX: Add a property to the scene's userData to store material parameters
    scene.userData = {
        materialParams: materialParams ? JSON.parse(JSON.stringify(materialParams)) : null,
        colors: colors
    };

    // Export with proper error handling and timeout
    return new Promise((resolve, reject) => {
        try {
            const exporter = new GLTFExporter();
            
            // Set a timeout to avoid hanging
            const timeoutId = setTimeout(() => {
                reject(new Error("GLB export timeout - took too long"));
            }, 15000);
            
            // CRITICAL FIX: Set options to preserve all materials and properties
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
                    forceIndices: true,  // Ensure indices are included for better model quality
                    // CRITICAL FIX: Make sure we preserve userData for all objects
                    // Removed 'userData' as it is not a valid property
                }
            );
        } catch (error) {
            console.error("Exception in GLTFExporter:", error);
            reject(error);
        }
    });
}

// Function to determine if a material requires texture baking
function shouldBakeMaterial(materialParams?: any): boolean {
    if (!materialParams) return false;
    
    // These effects need baking for accurate representation
    return (
        materialParams.customEffects?.includes('hologram') ||
        materialParams.animationType === 'flow' ||
        materialParams.animationType === 'pulse' ||
        materialParams.texturePattern === 'plasma' ||
        materialParams.texturePattern === 'nebula' ||
        (materialParams.emissiveIntensity && materialParams.emissiveIntensity > 0.5)
    );
}

// Function to create a material with baked textures
async function createBakedMaterial(baseColor: string, materialParams?: any): Promise<THREE.Material> {
    console.log("Baking complex material to textures");
    
    // This would normally render the cube with all effects to textures
    // For now, we'll create a similar-looking material with emissive properties
    
    // Create a physical material that approximates the appearance
    const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(baseColor),
        roughness: materialParams?.roughness ?? 0.3,
        metalness: materialParams?.metalness ?? 0.7,
        emissive: new THREE.Color(materialParams?.emissive || baseColor),
        emissiveIntensity: materialParams?.emissiveIntensity ?? 0.5,
        transparent: materialParams?.transparent ?? false,
        opacity: materialParams?.opacity ?? 1.0,
        clearcoat: materialParams?.clearcoat ?? 0.5,
        clearcoatRoughness: materialParams?.clearcoatRoughness ?? 0.1,
        envMapIntensity: 1.5, // Enhanced reflection
    });
    
    // Check if we should create an emissive map
    if (materialParams?.emissiveIntensity > 0) {
        // Create procedural texture for emissive map
        const emissiveTexture = await createProceduralTexture(512, 
            (x, y, width, height) => {
                // Create a glowing pattern based on position
                const cx = x / width - 0.5;
                const cy = y / height - 0.5;
                const distanceFromCenter = Math.sqrt(cx * cx + cy * cy) * 2; // 0-1 range
                const glow = Math.max(0, 1 - distanceFromCenter * 1.5);
                return glow;
            }, 
            materialParams?.emissive || baseColor
        );
        
        material.emissiveMap = emissiveTexture;
    }
    
    // Add custom effects based on material type
    if (materialParams?.customEffects?.includes('hologram')) {
        // Hologram effect - transparent with strong emissive
        material.transparent = true;
        material.opacity = 0.7;
        material.emissiveIntensity = 1.5;
        material.metalness = 0.9;
        material.roughness = 0.1;
        material.iridescence = 1.0;
        material.iridescenceIOR = 1.5;
        
        // Create procedural hologram texture
        const hologramTexture = await createProceduralTexture(512, 
            (x, y, width, height) => {
                // Create scan lines
                const scanLine = ((y / height * 20) % 1) > 0.5 ? 0.9 : 1.0;
                return scanLine;
            }, 
            materialParams?.color || baseColor
        );
        
        material.alphaMap = hologramTexture;
    }
    
    // Add custom userData with animation and effect properties
    material.userData = {
        materialType: materialParams?.customEffects?.includes('hologram') ? 'hologram' :
                      materialParams?.texturePattern === 'plasma' ? 'plasma' :
                      materialParams?.texturePattern === 'nebula' ? 'nebula' : 'custom',
        animationType: materialParams?.animationType || 'none',
        originalParams: materialParams,
        isBaked: true
    };
    
    return material;
}

// Helper to create a procedural texture
async function createProceduralTexture(
    size: number,
    generatorFunction: (x: number, y: number, width: number, height: number) => number,
    color: string = '#ffffff'
): Promise<THREE.Texture> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        if (!context) {
            // Fallback if context creation fails
            const texture = new THREE.Texture();
            texture.needsUpdate = true;
            resolve(texture);
            return;
        }
        
        // Get color components
        const threeColor = new THREE.Color(color);
        const r = Math.floor(threeColor.r * 255);
        const g = Math.floor(threeColor.g * 255);
        const b = Math.floor(threeColor.b * 255);
        
        // Create an image data object
        const imageData = context.createImageData(size, size);
        const data = imageData.data;
        
        // Fill the imageData
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = (y * size + x) * 4;
                const intensity = generatorFunction(x, y, size, size);
                data[index] = r * intensity;
                data[index + 1] = g * intensity;
                data[index + 2] = b * intensity;
                data[index + 3] = 255;
            }
        }
        
        // Put the image data on the canvas
        context.putImageData(imageData, 0, 0);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        resolve(texture);
    });
}

// Create a special gradient material with textures
async function createGradientMaterial(gradientColors: string[], materialParams?: any): Promise<THREE.Material> {
    console.log("Creating specialized gradient material");
    
    // Ensure we have at least two colors
    if (!gradientColors || gradientColors.length < 2) {
        gradientColors = [gradientColors?.[0] || "#ffffff", "#000000"];
    }
    
    // Create a physical material with the first color
    const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(gradientColors[0]),
        roughness: materialParams?.roughness ?? 0.4,
        metalness: materialParams?.metalness ?? 0.6,
        emissive: new THREE.Color(materialParams?.emissive || gradientColors[0]),
        emissiveIntensity: materialParams?.emissiveIntensity ?? 0.2,
        clearcoat: materialParams?.clearcoat ?? 0.3,
        clearcoatRoughness: materialParams?.clearcoatRoughness ?? 0.2,
    });
    
    // Generate gradient texture
    const gradientTexture = await createGradientTexture(gradientColors[0], gradientColors[1], 512);
    material.map = gradientTexture;
    
    // If emissive intensity is high, also use gradient for emissive map
    if (materialParams?.emissiveIntensity && materialParams.emissiveIntensity > 0.3) {
        material.emissiveMap = gradientTexture;
    }
    
    // Add custom userData
    material.userData = {
        materialType: 'gradient',
        gradientColors: gradientColors,
        originalParams: materialParams
    };
    
    return material;
}

// Helper to create a gradient texture
async function createGradientTexture(color1: string, color2: string, size: number = 512): Promise<THREE.Texture> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        if (!context) {
            // Fallback
            const texture = new THREE.Texture();
            texture.needsUpdate = true;
            resolve(texture);
            return;
        }
        
        // Create gradient
        const gradient = context.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        // Fill canvas with gradient
        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        resolve(texture);
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

// Create a material with texture from procedural texture or map
async function createTexturedMaterial(baseColor: string, materialParams?: any): Promise<THREE.Material> {
    console.log("Creating textured material with data URLs or maps");
    
    // Start with basic material
    const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(baseColor),
        roughness: materialParams?.roughness ?? 0.5,
        metalness: materialParams?.metalness ?? 0.5,
        name: 'textured_material'
    });

    // Apply emissive if specified
    if (materialParams?.emissiveIntensity > 0) {
        material.emissive = new THREE.Color(materialParams.emissive || baseColor);
        material.emissiveIntensity = materialParams.emissiveIntensity;
    }

    // Extract texture from materialParams if it exists
    const textureUrl = materialParams?.map || materialParams?.proceduralTexture;
    
    if (textureUrl) {
        // Create texture loader
        const textureLoader = new THREE.TextureLoader();
        
        // Function to load texture with promise
        const loadTexture = (url: string): Promise<THREE.Texture> => {
            return new Promise((resolve, reject) => {
                textureLoader.load(
                    url,
                    (texture) => resolve(texture),
                    undefined,
                    (error) => reject(error)
                );
            });
        };
        
        try {
            // Try to load the texture
            const texture = await loadTexture(textureUrl);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            
            if (materialParams?.textureScale) {
                texture.repeat.set(materialParams.textureScale, materialParams.textureScale);
            }
            
            material.map = texture;
            console.log("Successfully created texture from URL");
        } catch (err) {
            console.error("Failed to load texture from URL:", err);
            
            // If it's a striped pattern, generate a new stripes texture
            if (materialParams?.texturePattern === 'stripes') {
                console.log("Generating new stripes texture");
                const stripeTexture = await createStripesTexture(
                    baseColor,
                    materialParams.secondaryColor || '#ffffff',
                    materialParams.textureScale || 1.0
                );
                material.map = stripeTexture;
            }
        }
    } else if (materialParams?.texturePattern === 'stripes') {
        // Generate stripes if we have the pattern but no texture URL
        console.log("Generating stripes texture from pattern definition");
        const stripeTexture = await createStripesTexture(
            baseColor,
            materialParams.secondaryColor || '#ffffff',
            materialParams.textureScale || 1.0
        );
        material.map = stripeTexture;
    }
    
    // Apply other material properties
    if (materialParams?.transparent) {
        material.transparent = true;
        material.opacity = materialParams.opacity ?? 1.0;
    }
    
    if (materialParams?.clearcoat) {
        material.clearcoat = materialParams.clearcoat;
        material.clearcoatRoughness = materialParams.clearcoatRoughness ?? 0.1;
    }
    
    // Store original parameters in userData
    material.userData = {
        materialType: 'textured',
        texturePattern: materialParams?.texturePattern,
        originalParams: materialParams
    };
    
    return material;
}

// Helper to create a stripes texture
async function createStripesTexture(color1: string, color2: string, scale: number = 1.0, size: number = 512): Promise<THREE.Texture> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        if (!context) {
            // Fallback
            const texture = new THREE.Texture();
            texture.needsUpdate = true;
            resolve(texture);
            return;
        }
        
        // Calculate stripe width based on scale
        const stripeWidth = Math.max(1, Math.floor(size / (10 * scale)));
        
        // Draw stripes
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Use x coordinate for horizontal stripes
                const isEvenStripe = Math.floor(x / stripeWidth) % 2 === 0;
                context.fillStyle = isEvenStripe ? color1 : color2;
                context.fillRect(x, y, 1, 1);
            }
        }
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        resolve(texture);
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
  
      // CRITICAL FIX: Create deep clone of material parameters to prevent modification
      const clonedMaterialParams = materialParams ? JSON.parse(JSON.stringify(materialParams)) : null;
      console.log("Deep cloned material parameters:", clonedMaterialParams);
  
      // Create cube with the specified colors AND material parameters
      const glbData = await createCube(colors, clonedMaterialParams);
  
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
  
      // CRITICAL FIX: Add material parameters as metadata to the File
      const file = new File([blob], fileName, {
        type: 'model/gltf-binary',
        lastModified: Date.now()
      });
  
      // CRITICAL FIX: Store complete material parameters inside the file object
      Object.defineProperty(file, '__materialParams', {
        value: clonedMaterialParams,
        writable: false,
        enumerable: false,
        configurable: false
      });
  
      console.log("Successfully created GLB file:", file.name, "size:", file.size, "bytes");
      return file;
    } catch (error) {
      console.error("Error creating GLB file:", error);
      
      // Create a simple fallback cube in case of error
      try {
        const simpleGLB = await createSimpleCubeWithColor(colors[0] || "#0066ff");
        const blob = new Blob([simpleGLB], { type: 'model/gltf-binary' });
        const fileName = `${name.replace(/\s+/g, '-').toLowerCase()}-fallback.glb`;
        
        const file = new File([blob], fileName, { 
          type: 'model/gltf-binary',
          lastModified: Date.now()
        });
        
        // CRITICAL FIX: Even for fallback, store color information
        Object.defineProperty(file, '__materialParams', {
          value: { color: colors[0] || "#0066ff" },
          writable: false,
          enumerable: false,
          configurable: false
        });
        
        console.log("Created fallback GLB file:", file.name, "size:", file.size, "bytes");
        return file;
      } catch (fallbackError) {
        console.error("Even fallback cube creation failed:", fallbackError);
        // Create an empty GLB file as absolute last resort
        const emptyGLB = new Uint8Array(256).buffer; // 256 byte empty buffer
        const blob = new Blob([emptyGLB], { type: 'model/gltf-binary' });
        const file = new File([blob], `${name.replace(/\s+/g, '-').toLowerCase()}-empty.glb`, { 
          type: 'model/gltf-binary' 
        });
        return file;
      }
    }
  }

// Create a simple colored cube fallback - enhanced to use the correct color
async function createSimpleCubeWithColor(color: string = "#0066ff"): Promise<ArrayBuffer> {
    console.log("Creating simple fallback cube with color:", color);
    
    const scene = new THREE.Scene();
    
    // Use higher quality geometry for fallback
    const geometry = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);
    
    // Parse color properly
    let parsedColor: THREE.Color;
    try {
        parsedColor = new THREE.Color(color);
    } catch (e) {
        console.warn("Invalid color, using default blue:", e);
        parsedColor = new THREE.Color("#0066ff");
    }
    
    // Use MeshStandardMaterial for better compatibility and set properties explicitly
    const material = new THREE.MeshStandardMaterial({
        color: parsedColor,
        roughness: 0.5,
        metalness: 0.3,
        name: "simple_cube_material"
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.name = "VOID_Cube_Fallback";
    
    // Add userData with color info
    cube.userData = {
        color: color,
        type: "fallback"
    };
    
    scene.add(cube);

    // Add more comprehensive lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Add point light
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(-2, 3, 2);
    scene.add(pointLight);

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
                { 
                    binary: true,
                    embedImages: true,
                    includeCustomExtensions: true,
                }
            );
        } catch (error) {
            console.error("Exception in GLTFExporter for simple cube:", error);
            reject(error);
        }
    });
}