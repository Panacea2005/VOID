// app/api/cube/[color]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export async function GET(
    request: NextRequest,
    { params }: { params: { color?: string } }
): Promise<NextResponse> {
    try {
        const color = params.color || 'ff66cc'; // Default pink if no color provided
        
        // Get texture and animation from query params
        const texture = request.nextUrl.searchParams.get('texture') || 'default';
        const animation = request.nextUrl.searchParams.get('animation') || 'none';
        
        console.log(`Generating cube with: color=#${color}, texture=${texture}, animation=${animation}`);
        
        // Validate color is a valid hex (with or without #)
        const validColor = color.startsWith('#') ? color : `#${color}`;
        const isValidHex = /^#[0-9A-F]{6}$/i.test(validColor);
        
        // Create cube GLB with the specified parameters
        const cubeBuffer = await createCubeGLB(
            isValidHex ? validColor : '#ff66cc', 
            texture,
            animation
        );
        
        return new NextResponse(cubeBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'model/gltf-binary',
                'Cache-Control': 'public, max-age=86400', // Cache for 1 day
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('Error generating cube:', error);
        return NextResponse.json(
            { error: `Failed to generate cube: ${error}` },
            { status: 500 }
        );
    }
}

async function createCubeGLB(color: string, texture: string, animation: string): Promise<ArrayBuffer> {
    // Create a scene
    const scene = new THREE.Scene();
    
    // Create cube geometry with higher detail
    const geometry = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);
    
    // Create materials based on color
    // Darken the color for different faces to create a gradient effect
    const baseColor = new THREE.Color(color);
    
    // Generate 6 colors with variations
    const colors = [
        baseColor.clone(),
        baseColor.clone().multiplyScalar(0.9),
        baseColor.clone().multiplyScalar(0.8),
        baseColor.clone().multiplyScalar(0.7),
        baseColor.clone().multiplyScalar(0.6),
        baseColor.clone().multiplyScalar(0.5)
    ];
    
    // Create materials for each face with texture effects
    const materials = colors.map(color => {
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.5,
            metalness: 0.5
        });
        
        // Apply texture effects based on texture parameter
        if (texture === 'nebula') {
            material.emissive = color.clone().multiplyScalar(0.5);
            material.emissiveIntensity = 0.5;
        } else if (texture === 'glass') {
            material.transparent = true;
            material.opacity = 0.8;
            material.roughness = 0.1;
        } else if (texture === 'metal') {
            material.metalness = 0.9;
            material.roughness = 0.2;
        } else if (texture === 'plasma') {
            material.emissive = color.clone().multiplyScalar(0.7);
            material.emissiveIntensity = 0.7;
            material.metalness = 0.7;
        }
        
        return material;
    });
    
    // Create a multi-material cube
    const cube = new THREE.Mesh(geometry, materials);
    
    // Add animation data based on animation parameter
    if (animation) {
        cube.userData.animation = animation;
    }
    
    // Add texture data
    cube.userData.texture = texture;
    
    // Add base color data
    cube.userData.color = color;
    
    scene.add(cube);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Add a point light for better highlights
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(-3, 2, 5);
    scene.add(pointLight);
    
    // Export the scene to GLB
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
                        // Handle JSON result (should be rare)
                        console.warn("Received JSON output instead of binary, converting to ArrayBuffer...");
                        try {
                            const output = JSON.stringify(result);
                            const blob = new Blob([output], { type: 'application/json' });
                            const reader = new FileReader();
                            reader.readAsArrayBuffer(blob);
                            reader.onloadend = () => {
                                clearTimeout(timeoutId);
                                if (reader.result) {
                                    resolve(reader.result as ArrayBuffer);
                                } else {
                                    reject(new Error("Failed to convert JSON to ArrayBuffer"));
                                }
                            };
                            reader.onerror = (error) => {
                                clearTimeout(timeoutId);
                                reject(error);
                            };
                        } catch (error) {
                            clearTimeout(timeoutId);
                            reject(error);
                        }
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
                    includeCustomExtensions: true 
                }
            );
        } catch (error) {
            console.error("Exception in GLTFExporter:", error);
            reject(error);
        }
    });
}