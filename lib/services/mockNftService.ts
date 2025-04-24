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

// Fixed collection names
const VOID_CUBE_COLLECTION = "VOID Cube Collection";
const VOID_MUSIC_COLLECTION = "VOID Music Collection";

// Update mockMintNFT to properly handle and include 3D model files
export async function mockMintNFT(metadata: MockNFTMetadata, materialParams?: any): Promise<string> {
    try {
        console.log('Starting mockMintNFT process with metadata:', metadata.name);
        console.log('Material params:', JSON.stringify(materialParams, null, 2));
        
        // First verify the image file size to make sure it's valid
        if (metadata.image.size < 100) {
            console.error("Image file is too small, possibly blank:", metadata.image.size, "bytes");
            throw new Error("Image file appears to be blank or corrupt");
        }
        
        // Upload image to IPFS
        console.log('Uploading image to Pinata...');
        const imageIpfsHash = await uploadToPinata(metadata.image, {
            name: metadata.name,
            description: metadata.description,
            attributes: metadata.attributes,
            type: metadata.image.type || 'image/png'
        });

        // Get URL for the image using multiple gateways for reliability
        const imageUrl = getIpfsUrl(imageIpfsHash);
        const fallbackImages = [
            `https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`,
            `https://cloudflare-ipfs.com/ipfs/${imageIpfsHash}`,
            `https://ipfs.filebase.io/ipfs/${imageIpfsHash}`
        ];
        
        console.log("Image uploaded successfully to IPFS:", imageUrl);
        console.log("Fallback image URLs:", fallbackImages);

        // Determine NFT type (music or cube)
        const isMusic = !!metadata.audioUrl;
        const collectionName = isMusic ? VOID_MUSIC_COLLECTION : VOID_CUBE_COLLECTION;

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

        // For cube NFTs, create and upload 3D model
        if (!isMusic) {
            try {
                console.log('Creating 3D model for NFT...');
                
                // Extract color information from material params or attributes
                let colors: string[] = [];
                
                // First check material params for colors
                if (materialParams?.gradientColors && materialParams.gradientColors.length > 0) {
                    colors = [...materialParams.gradientColors];
                } else if (materialParams?.color) {
                    colors = [materialParams.color];
                } else {
                    // Check attributes for color
                    const colorAttr = metadata.attributes.find(attr => attr.trait_type === 'Color');
                    if (colorAttr?.value) {
                        colors = [colorAttr.value];
                    } else {
                        // Default color if nothing else is found
                        colors = ['#5d4fff'];
                    }
                }
                
                console.log('Using colors for 3D model:', colors);
                
                // Pass the complete materialParams to convertGLBToFile
                const glbFile = await convertGLBToFile(colors, metadata.name, materialParams);
                console.log('Created 3D model:', glbFile.name, 'type:', glbFile.type, 'size:', glbFile.size);
                
                // Verify the GLB file size to ensure it's valid
                if (glbFile.size < 1000) { // GLB files should be at least 1KB
                    console.warn("GLB file is suspiciously small:", glbFile.size, "bytes");
                    throw new Error("Generated GLB file is too small, regenerating with more robust settings");
                }

                // Ensure correct MIME type for GLB file
                const modelMimeType = 'model/gltf-binary';

                // Upload 3D model to Pinata with correct metadata
                console.log('Uploading 3D model to Pinata...');
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
                
                // Make a second attempt with simplified parameters
                try {
                    console.log('Making second attempt to create 3D model with simplified parameters...');
                    
                    // Extract just the color for a simpler model
                    const colorAttr = metadata.attributes.find(attr => attr.trait_type === 'Color');
                    const color = colorAttr?.value || '#5d4fff';
                    
                    // Create a simplified model with just color
                    const glbFile = await convertGLBToFile([color], metadata.name);
                    
                    // Upload the simplified model
                    model3dIpfsHash = await uploadToPinata(glbFile, {
                        name: metadata.name + " 3D Model (Fallback)",
                        description: "Fallback 3D Model for " + metadata.name,
                        type: 'model/gltf-binary'
                    });
                    
                    // Create URLs for the 3D model
                    modelIpfsUri = `ipfs://${model3dIpfsHash}`;
                    directModelUrl = getDirectModelUrl(model3dIpfsHash);
                    modelViewerUrl = getModelViewerUrl(model3dIpfsHash);
                    fallbackModel3d = [
                        `https://gateway.pinata.cloud/ipfs/${model3dIpfsHash}`,
                        `https://cloudflare-ipfs.com/ipfs/${model3dIpfsHash}`,
                        `https://dweb.link/ipfs/${model3dIpfsHash}`
                    ];
                    
                    console.log("Fallback model uploaded successfully:", model3dIpfsHash);
                } catch (fallbackError) {
                    console.error("Even fallback model creation failed:", fallbackError);
                    // Continue without 3D model - we'll just have a 2D NFT
                }
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
            ipfsUrl: getIpfsUrl(imageIpfsHash),
            ipfsHash: imageIpfsHash,
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
            // Music NFT logic
            nftData = {
                ...baseNftProps,
                audioUrl: audioUrl,
                properties: {
                    ...baseNftProps.properties,
                    files: [
                        ...baseNftProps.properties.files,
                        {
                            uri: audioUrl,
                            type: audioType
                        }
                    ],
                    audio_url: audioUrl,
                    animation_url: audioUrl, // For compatibility with marketplaces
                    audio_type: audioType
                },
                type: "music"
            };
        } else {
            // Cube NFT with full 3D model and material parameters
            nftData = {
                ...baseNftProps,
                model3d: directModelUrl,
                modelIpfsUri,
                modelViewerUrl,
                model3dHash: model3dIpfsHash,
                fallbackModel3d,
                model3dType: 'model/gltf-binary',
                materialParams: materialParams, // Store full material parameters at top level
                colors: metadata.attributes.find(attr => attr.trait_type === 'Color')?.value 
                    ? [metadata.attributes.find(attr => attr.trait_type === 'Color')?.value] 
                    : materialParams?.gradientColors || [materialParams?.color || '#5d4fff'], // Store colors directly
                properties: {
                  ...baseNftProps.properties,
                  files: [
                    ...baseNftProps.properties.files,
                    // Only add model file if we have a model
                    ...(model3dIpfsHash ? [{
                      uri: modelIpfsUri,
                      type: 'model/gltf-binary',
                      cdn: directModelUrl
                    }] : [])
                  ],
                  model: modelIpfsUri, // Standard property for model
                  animation_url: modelIpfsUri, // For compatibility with marketplaces
                  model_viewer_url: modelViewerUrl,
                  model_type: "glb",
                  materialParams: materialParams, // Store in properties as well
                  colors: metadata.attributes.find(attr => attr.trait_type === 'Color')?.value 
                    ? [metadata.attributes.find(attr => attr.trait_type === 'Color')?.value] 
                    : materialParams?.gradientColors || [materialParams?.color || '#5d4fff']  // Store colors in properties too
                },
                type: "cube",
                shapeType: "complex",
                color: (metadata.attributes.find(attr => attr.trait_type === 'Color')?.value || materialParams?.color || "#5d4fff")
            };
            
            // Add texture and animation info if available
            const textureAttr = metadata.attributes.find(attr => attr.trait_type === 'Texture');
            if (textureAttr?.value) {
                nftData.texture = textureAttr.value;
                nftData.properties.texture = textureAttr.value;
            } else if (materialParams?.texturePattern) {
                nftData.texture = materialParams.texturePattern;
                nftData.properties.texture = materialParams.texturePattern;
            }
            
            const animationAttr = metadata.attributes.find(attr => attr.trait_type === 'Animation');
            if (animationAttr?.value) {
                nftData.animation = animationAttr.value;
                nftData.properties.animation = animationAttr.value;
            } else if (materialParams?.animationType) {
                nftData.animation = materialParams.animationType;
                nftData.properties.animation = materialParams.animationType;
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

// Get list of minted NFTs
export function getUserNFTs() {
    if (typeof window === 'undefined') return [];
    try {
        const nfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
        console.log("Loaded NFTs from localStorage:", nfts.length);

        // Normalize fields before returning
        const normalizedNfts = nfts.map((nft: any) => {
            // Ensure each NFT has a type field
            if (!nft.type) {
                nft.type = nft.audioUrl ? "music" : "cube";
            }

            // Ensure they have txSignature and mintAddress
            if (!nft.txSignature && nft.id) {
                nft.txSignature = `mock_tx_${nft.id.substring(0, 8)}${Date.now()}`;
            }

            if (!nft.mintAddress && nft.id) {
                nft.mintAddress = nft.id;
            }

            // Ensure NFT has all basic properties
            return {
                ...nft,
                type: nft.type || "cube",
                shapeType: nft.shapeType || "complex",
                price: nft.price || 1.0,
                mintedAt: nft.mintedAt || new Date().toISOString()
            };
        });

        // Return NFTs sorted by mint time (newest first)
        return normalizedNfts.sort((a: any, b: any) => {
            const dateA = new Date(a.mintedAt).getTime();
            const dateB = new Date(b.mintedAt).getTime();
            return dateB - dateA;
        });
    } catch (error) {
        console.error("Error reading NFTs from localStorage:", error);
        return [];
    }
}

// Check and update URLs for image
export function refreshNFTImageURLS() {
    if (typeof window === 'undefined') return;

    try {
        const nfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
        let hasChanges = false;

        // Check and update URLs for NFTs
        for (const nft of nfts) {
            // Ensure each NFT has valid image URL
            if (!nft.image || (nft.image.startsWith('blob:') && !isValidBlobURL(nft.image)) || nft.image.includes('undefined')) {
                // Prioritize using ipfsHash with gateway URL
                if (nft.ipfsHash) {
                    // Use multiple gateways for backup access
                    nft.image = `https://ipfs.filebase.io/ipfs/${nft.ipfsHash}`;
                    // Add fallback URLs with more gateways
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
                        // Add direct path for environments using localhost or vercel
                        `/api/ipfs/${nft.ipfsHash}`
                    ];
                    hasChanges = true;
                } else if (nft.ipfsUrl) {
                    // Convert IPFS URL to gateway URL if needed
                    if (nft.ipfsUrl.startsWith('ipfs://')) {
                        const cid = nft.ipfsUrl.replace('ipfs://', '');
                        nft.image = `https://ipfs.filebase.io/ipfs/${cid}`;
                        // Add fallback URLs with more gateways
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
                    // If no valid image URL, set default placeholder
                    nft.image = '/placeholder.jpg';
                    hasChanges = true;
                }
            }

            // Add fallback URLs if they don't exist
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

            // Check and update model3d URL
            if (nft.model3dHash && (!nft.model3d || (nft.model3d.startsWith('blob:') && !isValidBlobURL(nft.model3d)))) {
                // Use utility functions to create proper URLs
                const directModelUrl = getDirectModelUrl(nft.model3dHash);
                nft.model3d = directModelUrl;
                // Add fallback URLs for model3d with more gateways
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

                // Add standard IPFS URI if not already present
                if (!nft.modelIpfsUri) {
                    nft.modelIpfsUri = `ipfs://${nft.model3dHash}`;
                }

                // Add URL for model viewer
                nft.modelViewerUrl = getModelViewerUrl(nft.model3dHash);

                // Update properties to match
                if (!nft.properties) nft.properties = {};
                if (!nft.properties.files) nft.properties.files = [];

                // Find and update model file in properties.files
                const modelFileIndex = nft.properties.files.findIndex((file: any) =>
                    file.type === 'model/gltf-binary' || file.uri.includes(nft.model3dHash));

                if (modelFileIndex >= 0) {
                    // Update model file if it already exists
                    nft.properties.files[modelFileIndex] = {
                        uri: nft.modelIpfsUri,
                        type: 'model/gltf-binary',
                        cdn: directModelUrl
                    };
                } else {
                    // Add new model file if it doesn't exist
                    nft.properties.files.push({
                        uri: nft.modelIpfsUri,
                        type: 'model/gltf-binary',
                        cdn: directModelUrl
                    });
                }

                // Update model info in properties
                nft.properties.model_type = "glb";
                nft.properties.model = nft.modelIpfsUri;
                nft.properties.animation_url = nft.modelIpfsUri;
                nft.properties.model_viewer_url = nft.modelViewerUrl;

                hasChanges = true;
            }

            // Ensure type field exists
            if (!nft.type) {
                nft.type = nft.audioUrl ? "music" : "cube";
                hasChanges = true;
            }

            // Ensure txSignature exists
            if (!nft.txSignature && nft.mintAddress) {
                nft.txSignature = `mock_tx_${nft.mintAddress.substring(0, 8)}${Date.now()}`;
                hasChanges = true;
            }

            // Ensure NFT has necessary properties for 3D model
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

            // Add model 3D to properties.files if it has model3d but not in properties
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

            // Preload images for better experience
            preloadImages(nfts);
        }
    } catch (error) {
        console.error("Error updating NFT URLs:", error);
    }
}

// Check if Blob URL is still valid
export function isValidBlobURL(url: string): boolean {
    try {
        return URL.createObjectURL(new Blob(['test'])).startsWith('blob:');
    } catch (e) {
        return false;
    }
}

// Preload images function for optimization
export function preloadImages(nfts: any[]): void {
    if (typeof window === 'undefined') return;
    console.log("Starting to preload NFT images");

    nfts.forEach(nft => {
        if (!nft || !nft.name) {
            console.log("Skipping invalid NFT");
            return;
        }

        // Create image loading function with fallback
        const tryLoadImage = (url: string, fallbackUrls: string[] = [], index = 0, maxAttempts = 5) => {
            if (!url || index >= maxAttempts) {
                console.log(`Failed to load image for NFT ${nft.name} after ${maxAttempts} attempts`);

                // If there are fallback URLs, try next one
                if (fallbackUrls && fallbackUrls.length > 0) {
                    console.log(`Trying fallback URL for NFT ${nft.name}: ${fallbackUrls[0]}`);
                    tryLoadImage(fallbackUrls[0], fallbackUrls.slice(1), 0, maxAttempts);
                } else if (nft.ipfsHash) {
                    // Try generating new URL from ipfsHash
                    const newUrl = `https://nftstorage.link/ipfs/${nft.ipfsHash}`;
                    console.log(`Generating new URL from ipfsHash for NFT ${nft.name}: ${newUrl}`);
                    tryLoadImage(newUrl, [], 0, 2);
                }
                return;
            }

            const img = new Image();

            img.onload = () => {
                console.log(`Successfully preloaded image for NFT ${nft.name}: ${url}`);
                // Update image URL if successful and different from original
                if (url !== nft.image) {
                    nft.image = url;
                    // Save successful URL to localStorage
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

                // Try again with current URL after short delay
                if (index < maxAttempts - 1) {
                    setTimeout(() => {
                        tryLoadImage(url, fallbackUrls, index + 1, maxAttempts);
                    }, 500 + index * 500); // Increasing delay with each retry
                } else if (fallbackUrls && fallbackUrls.length > 0) {
                    // Try next fallback URL
                    console.log(`Trying fallback URL for NFT ${nft.name}: ${fallbackUrls[0]}`);
                    tryLoadImage(fallbackUrls[0], fallbackUrls.slice(1), 0, maxAttempts);
                } else if (nft.ipfsHash) {
                    // Try generating new URLs from ipfsHash
                    const apiEndpoint = `/api/ipfs/${nft.ipfsHash}`;
                    console.log(`Last resort: trying local API endpoint for NFT ${nft.name}: ${apiEndpoint}`);
                    tryLoadImage(apiEndpoint, [], 0, 3);
                }
            };

            // Add timeout mechanism for loading
            const timeoutId = setTimeout(() => {
                // If image hasn't loaded after 10 seconds, cancel and try another URL
                if (!img.complete) {
                    console.log(`Timeout loading image from ${url} for NFT ${nft.name}`);
                    img.src = ''; // Cancel current load

                    if (fallbackUrls && fallbackUrls.length > 0) {
                        tryLoadImage(fallbackUrls[0], fallbackUrls.slice(1), 0, maxAttempts);
                    } else if (nft.ipfsHash) {
                        const apiEndpoint = `/api/ipfs/${nft.ipfsHash}`;
                        tryLoadImage(apiEndpoint, [], 0, 3);
                    }
                }
            }, 10000); // 10 second timeout

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

        // Ensure NFT has fallbackImages array
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

        // Start loading primary image
        if (nft.image) {
            console.log(`Preloading primary image for NFT ${nft.name}: ${nft.image}`);
            tryLoadImage(nft.image, nft.fallbackImages || []);
        } else if (nft.fallbackImages && nft.fallbackImages.length > 0) {
            // If no primary image, try first fallback
            console.log(`No primary image, using first fallback for NFT ${nft.name}: ${nft.fallbackImages[0]}`);
            tryLoadImage(nft.fallbackImages[0], nft.fallbackImages.slice(1));
        } else if (nft.ipfsHash) {
            // If no URLs, generate from ipfsHash
            const ipfsUrl = `https://ipfs.filebase.io/ipfs/${nft.ipfsHash}`;
            console.log(`No image URLs, generating from ipfsHash for NFT ${nft.name}: ${ipfsUrl}`);
            tryLoadImage(ipfsUrl, [
                `https://nftstorage.link/ipfs/${nft.ipfsHash}`,
                `https://gateway.pinata.cloud/ipfs/${nft.ipfsHash}`,
                `https://cloudflare-ipfs.com/ipfs/${nft.ipfsHash}`,
                `/api/ipfs/${nft.ipfsHash}`
            ]);
        }

        // Preload 3D model by sending HEAD request
        if (nft.model3d && !nft.model3d.includes('modelviewer.dev')) {
            // Use separate model checking function
            checkModel3d(nft);
        }
    });
}

// Function to check 3D model
function checkModel3d(nft: any): void {
    try {
        // Use try-catch for the entire fetch operation
        // Just check without blocking main thread
        (async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch(nft.model3d, {
                    method: 'HEAD',
                    // Use no-cors mode to avoid CORS errors
                    mode: 'no-cors',
                    // Add signal for timeout support
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log(`Checked model3d URL for NFT ${nft.name}: ${nft.model3d}`);
            } catch (innerError: any) {
                // Try fallback URLs if primary not available
                if (nft.fallbackModel3d && nft.fallbackModel3d.length > 0) {
                    console.log(`Trying fallback model URL for NFT ${nft.name}: ${nft.fallbackModel3d[0]}`);
                    // Update model3d with first fallback URL
                    nft.model3d = nft.fallbackModel3d[0];

                    // Update in localStorage
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
            // Catch any unexpected errors in promise
            console.log(`Unexpected error checking model for NFT ${nft.name}: ${e.message}`);
        });
    } catch (error) {
        // Catch syntax or non-network errors
        console.log(`Error checking model3d URL: ${error}`);
    }
}

// Convert cube to PNG file for storage
export async function convertCubeToFile(canvasElement: HTMLCanvasElement, name: string): Promise<File> {
    return new Promise((resolve, reject) => {
        try {
            // Force a render of the canvas to ensure content is captured
            if (canvasElement.width === 0 || canvasElement.height === 0) {
                console.warn("Canvas has zero dimensions, using default size");
                canvasElement.width = 512;
                canvasElement.height = 512;
            }
            
            // Convert to high-quality PNG
            canvasElement.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to convert canvas to blob'));
                    return;
                }

                // Create a more meaningful filename
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

// Real NFT minting on Solana
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

        // Create 3D model GLB file
        console.log('Creating GLB file from cube data...');
        
        // Extract materialParams from attributes if available
        let materialParams: any = {};
        const textureAttr = cubeData.attributes.find(attr => attr.trait_type === 'Texture');
        const animationAttr = cubeData.attributes.find(attr => attr.trait_type === 'Animation');
        
        if (textureAttr && textureAttr.value) {
            materialParams.texturePattern = textureAttr.value;
        }
        
        if (animationAttr && animationAttr.value) {
            materialParams.animationType = animationAttr.value;
        }
        
        // Set some reasonable defaults based on texture type
        if (materialParams.texturePattern === 'plasma') {
            materialParams.emissiveIntensity = 1.5;
            materialParams.metalness = 0.7;
            materialParams.roughness = 0.4;
        } else if (materialParams.texturePattern === 'nebula') {
            materialParams.emissiveIntensity = 0.8;
            materialParams.metalness = 0.6;
            materialParams.roughness = 0.5;
        } else if (materialParams.texturePattern === 'hologram') {
            materialParams.customEffects = ['hologram'];
            materialParams.opacity = 0.8;
            materialParams.transparent = true;
        }
        
        // Create material parameters for proper 3D model generation
        const glbFile = await convertGLBToFile(cubeData.colors, cubeData.name, materialParams);
        console.log('GLB file created:', glbFile.name, 'type:', glbFile.type, 'size:', glbFile.size, 'bytes');

        // Ensure correct MIME type for GLB file
        const modelMimeType = 'model/gltf-binary';

        // Upload image to IPFS first
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

        // Upload 3D model to IPFS with correct content type
        console.log('Uploading 3D model to IPFS...');
        const model3dIpfsHash = await uploadToPinata(glbFile, {
            name: cubeData.name + " 3D Model",
            description: "3D Model for " + cubeData.name,
            type: modelMimeType,
            materialParams: JSON.stringify(materialParams)  // Include material params in metadata
        });

        // Create standard IPFS URI
        const modelIpfsUri = `ipfs://${model3dIpfsHash}`;

        // Create URLs for viewers
        const directModelUrl = getDirectModelUrl(model3dIpfsHash);
        const modelViewerUrl = getModelViewerUrl(model3dIpfsHash);

        const fallbackModel3d = [
            `https://gateway.pinata.cloud/ipfs/${model3dIpfsHash}`,
            `https://cloudflare-ipfs.com/ipfs/${model3dIpfsHash}`,
            `https://dweb.link/ipfs/${model3dIpfsHash}`
        ];

        // Ensure Collection attribute is added
        const hasCollection = cubeData.attributes.some(attr => attr.trait_type === 'Collection');
        if (!hasCollection) {
            cubeData.attributes.push({
                trait_type: 'Collection',
                value: VOID_CUBE_COLLECTION
            });
        }

        // Prepare complete metadata with all necessary fields for proper 3D model rendering
        const nftMetadata: any = {
            name: cubeData.name,
            symbol: "VOID",
            description: cubeData.description,
            image: imageUri,
            model: modelIpfsUri, // Add model field - important for 3D NFTs
            animation_url: modelIpfsUri, // Many marketplaces use this field for 3D models
            external_url: modelViewerUrl, // URL to view model externally
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
                model: modelIpfsUri,
                collection: {
                    name: VOID_CUBE_COLLECTION,
                    family: "VOID Cube"
                },
                // Include material parameters for perfect reproduction
                materialParams: materialParams
            }
        };

        // Log detailed information for debugging
        console.log('NFT Metadata prepared:', {
            name: nftMetadata.name,
            imageUri,
            modelUri: modelIpfsUri,
            hasModel3D: !!model3dIpfsHash
        });

        // Mint real NFT
        console.log('Minting NFT with prepared metadata...');

        // Convert metadata to format for NFT service
        const solanaMetadata = {
            name: nftMetadata.name,
            symbol: nftMetadata.symbol,
            description: nftMetadata.description,
            image: imageFile, // Pass original file rather than URI
            model: glbFile, // Pass original GLB file
            attributes: nftMetadata.attributes,
            properties: nftMetadata.properties
        };

        // Call actual NFT minting function
        const mintedNftAddress = await mintNFT(connection, wallet, solanaMetadata);
        console.log('Successfully minted NFT, address:', mintedNftAddress);

        // Get latest transaction information
        let txSignature;
        try {
            const signatures = await connection.getSignaturesForAddress(new PublicKey(mintedNftAddress));
            if (signatures && signatures.length > 0) {
                txSignature = signatures[0].signature;
                console.log('Got transaction signature:', txSignature);
            } else {
                // Create a mock signature if none found
                txSignature = `tx${Date.now()}${Math.random().toString(36).substring(2, 10)}`;
                console.log('Using mock transaction signature:', txSignature);
            }
        } catch (error) {
            // If retrieval fails, create a mock signature
            console.error('Error getting transaction signature:', error);
            txSignature = `tx${Date.now()}${Math.random().toString(36).substring(2, 10)}`;
            console.log('Using mock transaction signature after error:', txSignature);
        }

        // Save information to localStorage for immediate UI display
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
            symbol: "VOID",
            // Add material parameters at root level
            materialParams: materialParams,
            // Add color data at root level
            colors: cubeData.colors,
            // Add texture and animation at root level
            texture: materialParams.texturePattern,
            animation: materialParams.animationType
        };

        // Save to localStorage
        const userNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
        userNfts.push(nftData);
        localStorage.setItem('userNfts', JSON.stringify(userNfts));

        return mintedNftAddress;
    } catch (error) {
        console.error('Error minting real NFT:', error);
        throw error;
    }
}