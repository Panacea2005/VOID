import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import {
  getUserNFTs,
  refreshNFTImageURLS,
} from "@/lib/services/mockNftService";
import {
  getModelViewerUrl,
  getDirectModelUrl,
} from "@/lib/services/pinataService";
import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useWallet } from "@solana/wallet-adapter-react";
import ReactDOM from "react-dom";

// Original cube collection enhanced to include loading from NFTs
export const cubeCollection: Array<{
  id: string;
  name: string;
  colors: string[];
  accentColor: string;
  borderColor: string;
  glow: string;
  rarity: string;
  model3d?: string | null;
  isNFT?: boolean;
}> = [
  {
    id: "pink-neon",
    name: "Pink Neon",
    colors: ["#ff00ff", "#ec4899", "#f472b6", "#e879f9", "#d946ef", "#c026d3"],
    accentColor: "#ff00ff",
    borderColor: "rgba(255, 255, 255, 0.3)",
    glow: "0 0 20px rgba(236, 72, 153, 0.6)",
    rarity: "common",
  },
  {
    id: "cosmic-void",
    name: "Cosmic Void",
    colors: ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95", "#3a1078"],
    accentColor: "#8b5cf6",
    borderColor: "rgba(139, 92, 246, 0.5)",
    glow: "0 0 25px rgba(139, 92, 246, 0.7)",
    rarity: "rare",
  },
  {
    id: "crystal-blue",
    name: "Crystal Blue",
    colors: ["#0ea5e9", "#0284c7", "#0369a1", "#075985", "#0c4a6e", "#082f49"],
    accentColor: "#0ea5e9",
    borderColor: "rgba(14, 165, 233, 0.5)",
    glow: "0 0 25px rgba(14, 165, 233, 0.7)",
    rarity: "rare",
  },
  {
    id: "golden-relic",
    name: "Golden Relic",
    colors: ["#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f"],
    accentColor: "#fbbf24",
    borderColor: "rgba(251, 191, 36, 0.5)",
    glow: "0 0 25px rgba(251, 191, 36, 0.7)",
    rarity: "epic",
  },
  {
    id: "emerald-matrix",
    name: "Emerald Matrix",
    colors: ["#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"],
    accentColor: "#22c55e",
    borderColor: "rgba(34, 197, 94, 0.5)",
    glow: "0 0 25px rgba(34, 197, 94, 0.7)",
    rarity: "epic",
  },
  {
    id: "obsidian-void",
    name: "Obsidian Void",
    colors: ["#18181b", "#27272a", "#3f3f46", "#52525b", "#71717a", "#a1a1aa"],
    accentColor: "#a1a1aa",
    borderColor: "rgba(255, 255, 255, 0.2)",
    glow: "0 0 15px rgba(161, 161, 170, 0.5)",
    rarity: "legendary",
  },
  {
    id: "holographic",
    name: "Holographic",
    colors: ["#f0abfc", "#e879f9", "#d946ef", "#c026d3", "#a21caf", "#86198f"],
    accentColor: "#c026d3",
    borderColor: "rgba(240, 171, 252, 0.6)",
    glow: "0 0 30px rgba(192, 38, 211, 0.8)",
    rarity: "legendary",
  },
];

// Custom styles for cube rendering and scrollbar
const cubeStyles = `
  .cube-collection-container::-webkit-scrollbar {
    width: 4px;
    background: transparent;
  }
  
  .cube-collection-container::-webkit-scrollbar-thumb {
    background-color: rgba(139, 92, 246, 0.5);
    border-radius: 20px;
  }
  
  .cube-collection-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .cube-collection-container {
    scrollbar-width: thin;
    scrollbar-color: rgba(139, 92, 246, 0.5) transparent;
  }
  
  /* Essential 3D cube styles */
  .cube-scene {
    perspective: 800px;
    perspective-origin: center center;
  }
  
  .cube {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
  }
  
  .cube-face {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-style: solid;
  }
  
  /* Face transforms - properly positioned in 3D space */
  .cube-face-front {
    transform: translateZ(calc(var(--cube-size) / 2));
  }
  
  .cube-face-back {
    transform: rotateY(180deg) translateZ(calc(var(--cube-size) / 2));
  }
  
  .cube-face-right {
    transform: rotateY(90deg) translateZ(calc(var(--cube-size) / 2));
  }
  
  .cube-face-left {
    transform: rotateY(-90deg) translateZ(calc(var(--cube-size) / 2));
  }
  
  .cube-face-top {
    transform: rotateX(90deg) translateZ(calc(var(--cube-size) / 2));
  }
  
  .cube-face-bottom {
    transform: rotateX(-90deg) translateZ(calc(var(--cube-size) / 2));
  }
`;

// Get rarity styles (color and label)
const getRarityStyles = (rarity: string) => {
  switch (rarity) {
    case "common":
      return { color: "#a1a1aa", label: "COMMON" };
    case "rare":
      return { color: "#3b82f6", label: "RARE" };
    case "epic":
      return { color: "#8b5cf6", label: "EPIC" };
    case "legendary":
      return { color: "#f59e0b", label: "LEGENDARY" };
    default:
      return { color: "#a1a1aa", label: "COMMON" };
  }
};

function extractColorFromName(name: string) {
  // Expanded color map with more variations
  const colorMap = {
    red: "#ff0000",
    ruby: "#e0115f",
    crimson: "#dc143c",
    scarlet: "#ff2400",

    blue: "#0000ff",
    sapphire: "#0f52ba",
    azure: "#007fff",
    navy: "#000080",
    cyan: "#00ffff",
    teal: "#008080",

    green: "#00ff00",
    emerald: "#50c878",
    lime: "#32cd32",
    forest: "#228b22",
    jade: "#00a86b",

    yellow: "#ffff00",
    gold: "#ffd700",
    amber: "#ffbf00",
    lemon: "#fff44f",

    purple: "#8b5cf6",
    violet: "#8b5cf6",
    lavender: "#b57edc",
    magenta: "#ff00ff",
    mauve: "#e0b0ff",

    pink: "#ff00ff",
    rose: "#ff007f",
    fuchsia: "#ff77ff",

    orange: "#ffa500",
    coral: "#ff7f50",
    salmon: "#fa8072",

    brown: "#964b00",
    chocolate: "#7b3f00",
    tan: "#d2b48c",

    white: "#ffffff",
    silver: "#c0c0c0",
    gray: "#808080",
    black: "#000000",

    // Special VOID colors
    cosmic: "#8b5cf6",
    void: "#8b5cf6",
    neon: "#39ff14",
    crystal: "#a5f2f3",
    obsidian: "#18181b",
    holographic: "#f0abfc",
  };

  const nameLower = name.toLowerCase();

  // Check for exact matches first
  for (const [colorName, colorHex] of Object.entries(colorMap)) {
    // Check for the color name as a whole word
    const regex = new RegExp(`\\b${colorName}\\b`, "i");
    if (regex.test(nameLower)) {
      console.log(`Found color name "${colorName}" in name`);
      return colorHex;
    }
  }

  // Check for partial matches if no exact match
  for (const [colorName, colorHex] of Object.entries(colorMap)) {
    if (nameLower.includes(colorName)) {
      console.log(`Found partial color match "${colorName}" in name`);
      return colorHex;
    }
  }

  // No match found
  return null;
}

export function getCORSProxyURL(url: string): string {
  if (!url) return "";

  // Normalize the URL first - handle encoded URLs
  try {
    // Sometimes URL comes double encoded, try to decode once
    if (url.includes("%")) {
      url = decodeURIComponent(url);
    }
  } catch (e) {
    console.warn("Error decoding URL, using as is:", e);
  }

  // 1. For modelviewer.dev or known working external URLs, use as is
  if (
    url.includes("modelviewer.dev") ||
    url.includes("github.io") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  // 2. Handle IPFS URLs by extracting the CID and using our API endpoint

  // Handle standard IPFS gateway URLs like https://ipfs.io/ipfs/Qm...
  if (url.includes("/ipfs/")) {
    try {
      const parts = url.split("/ipfs/");
      if (parts.length >= 2) {
        // Extract CID and remove any query parameters
        let cid = parts[1].split("?")[0].split("#")[0].trim();
        // Clean any trailing slashes
        cid = cid.replace(/\/+$/, "");

        console.log(`Extracted CID from IPFS URL: ${cid}`);
        return `/api/ipfs/${cid}`;
      }
    } catch (e) {
      console.warn(
        "Error extracting CID from IPFS URL, using API fallback:",
        e
      );
      return `/api/ipfs?url=${encodeURIComponent(url)}`;
    }
  }

  // Handle ipfs:// protocol
  if (url.startsWith("ipfs://")) {
    try {
      const cid = url.replace("ipfs://", "").split("?")[0].split("#")[0].trim();
      console.log(`Extracted CID from ipfs:// URL: ${cid}`);
      return `/api/ipfs/${cid}`;
    } catch (e) {
      console.warn(
        "Error extracting CID from ipfs:// URL, using API fallback:",
        e
      );
      return `/api/ipfs?url=${encodeURIComponent(url)}`;
    }
  }

  // 3. Handle Pinata-specific URLs that may include gateway tokens
  if (url.includes("gateway.pinata.cloud") || url.includes("pinata.cloud")) {
    try {
      // Try to extract CID if this is an IPFS URL (should be handled by earlier cases)
      if (url.includes("/ipfs/")) {
        // This should be caught by the earlier /ipfs/ handler
        return `/api/ipfs?url=${encodeURIComponent(url)}`;
      } else {
        // For other Pinata URLs (like direct links with tokens)
        console.log("Using API endpoint for Pinata URL");
        return `/api/ipfs?url=${encodeURIComponent(url)}`;
      }
    } catch (e) {
      console.warn("Error processing Pinata URL, using API fallback:", e);
      return `/api/ipfs?url=${encodeURIComponent(url)}`;
    }
  }

  // 4. For all other http(s) URLs, use the API route with url parameter
  if (url.startsWith("http")) {
    return `/api/ipfs?url=${encodeURIComponent(url)}`;
  }

  // 5. For anything else, return as is (local paths, etc.)
  return url;
}

// Helper function for generating color shades
const generateColorShades = (baseColor: string): string[] => {
  return [
    baseColor,
    adjustColorBrightness(baseColor, -0.1),
    adjustColorBrightness(baseColor, -0.2),
    adjustColorBrightness(baseColor, -0.3),
    adjustColorBrightness(baseColor, -0.4),
    adjustColorBrightness(baseColor, -0.5),
  ];
};

// Helper function to extract colors from a model or create default colors
const extractColorsFromNFT = async (nft: any): Promise<string[]> => {
  console.log(`Extracting colors for NFT: ${nft.name || nft.id || "Unknown"}`);

  // Default colors if we can't extract them
  const defaultColors = [
    "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95", "#3a1078",
  ];

  try {
    // 1. Try to get metadata from URI if available
    let metadata = nft.metadata;
    if (!metadata && nft.uri) {
      try {
        console.log(`Fetching metadata from URI: ${nft.uri}`);
        metadata = await fetchMetadataWithRetry(nft.uri);
        if (metadata) {
          console.log(`Got metadata from URI`);
          // Store metadata in NFT object for later use
          nft.metadata = metadata;
        }
      } catch (error) {
        console.error(`Error fetching metadata:`, error);
      }
    }

    // Helper function to generate color shades
    const generateColorShades = (baseColor: string) => {
      return [
        baseColor,
        adjustColorBrightness(baseColor, -0.1),
        adjustColorBrightness(baseColor, -0.2),
        adjustColorBrightness(baseColor, -0.3),
        adjustColorBrightness(baseColor, -0.4),
        adjustColorBrightness(baseColor, -0.5),
      ];
    };

    // 2. Check for Color attribute in NFT - primary method for VOID Cubes
    const attributes = metadata?.attributes || nft.attributes;
    if (attributes && Array.isArray(attributes)) {
      const colorAttr = attributes.find(
        (attr: any) => attr.trait_type?.toLowerCase() === "color"
      );

      if (colorAttr && colorAttr.value) {
        console.log(`Found color attribute: ${colorAttr.value}`);
        return generateColorShades(colorAttr.value);
      }
    }

    // 3. Check for material parameters
    if (metadata?.materialParams?.color || nft.materialParams?.color) {
      const color = metadata?.materialParams?.color || nft.materialParams?.color;
      console.log(`Found color in materialParams: ${color}`);
      return generateColorShades(color);
    }

    // 4. Check for gradient colors
    if (metadata?.materialParams?.gradientColors || nft.materialParams?.gradientColors) {
      const colors = metadata?.materialParams?.gradientColors || nft.materialParams?.gradientColors;
      if (Array.isArray(colors)) {
        console.log(`Found gradient colors: ${colors.join(', ')}`);
        return colors;
      }
    }

    // 5. Extract from name as last resort
    if (nft.name) {
      const colorFromName = extractColorFromName(nft.name);
      if (colorFromName) {
        console.log(`Extracted color from name: ${colorFromName}`);
        return generateColorShades(colorFromName);
      }
    }

    // 6. If everything else fails, return default colors
    console.warn(`No color info found for NFT, using default purple colors`);
    return defaultColors;
  } catch (error) {
    console.error(`Error extracting colors:`, error);
    return defaultColors;
  }
};

// Helper function to sanitize and fix model URLs
function sanitizeModelUrl(url: string): string {
  if (!url) return url;

  try {
    // Convert IPFS URLs to HTTP
    if (url.startsWith("ipfs://")) {
      return `https://ipfs.io/ipfs/${url.replace("ipfs://", "")}`;
    }

    // Fix common URL issues
    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("data:")
    ) {
      return `https://${url}`;
    }

    return url;
  } catch (error) {
    console.error(`Error sanitizing model URL ${url}:`, error);
    return url;
  }
}

const processModelUrl = async (nft: any): Promise<string | null> => {
  console.log(`Processing model URL for NFT: ${nft.name || nft.id || "Unknown"}`);

  try {
    // Check if this is a VOID Cube from the collection
    const isVoidCube = 
      nft.name?.includes("VOID Cube") ||
      nft.metadata?.collection?.name === "VOID Cube Collection" ||
      nft.metadata?.properties?.collection?.name === "VOID Cube Collection" ||
      nft.attributes?.some((attr: any) => 
        attr.trait_type === "Collection" && attr.value === "VOID Cube Collection"
      );

    if (isVoidCube) {
      console.log("Identified as a VOID Cube NFT");
      
      // First try to get color from NFT attributes
      const attributes = nft.attributes || nft.metadata?.attributes || [];
      
      // Extract color attribute
      const colorAttr = attributes.find((attr: any) => 
        attr.trait_type === "Color"
      );
      
      let color = "ff66cc"; // Default pink
      if (colorAttr?.value) {
        // Remove # if present
        color = colorAttr.value.replace('#', '');
        console.log(`Extracted color from attributes: ${color}`);
      } else if (nft.color) {
        // Try getting from direct color property
        color = nft.color.replace('#', '');
        console.log(`Using color from nft.color: ${color}`);
      }
      
      // Extract texture attribute
      const textureAttr = attributes.find((attr: any) => 
        attr.trait_type === "Texture"
      );
      
      let texture = "default";
      if (textureAttr?.value) {
        texture = textureAttr.value.toLowerCase();
        console.log(`Extracted texture: ${texture}`);
      }
      
      // Extract animation attribute
      const animationAttr = attributes.find((attr: any) => 
        attr.trait_type === "Animation"
      );
      
      let animation = "none";
      if (animationAttr?.value) {
        animation = animationAttr.value.toLowerCase();
        console.log(`Extracted animation: ${animation}`);
      } else if (nft.animation) {
        // Try getting from direct animation property
        animation = nft.animation.toLowerCase();
        console.log(`Using animation from nft.animation: ${animation}`);
      }
      
      // Generate URL for on-demand cube
      return `/api/cube/${color}?texture=${texture}&animation=${animation}`;
    }

    // STEP 1: Check direct model URL fields (similar to audio extraction)
    const directModelFields = [
      "model3d",
      "model",
      "animation_url",
      "modelUrl",
      "modelIpfsUri",
      "direct_model_url",
      "modelViewerUrl",
      "3d_model",
      "glb_model"
    ];

    // Try each of these fields directly on the NFT object
    for (const field of directModelFields) {
      if (nft[field] && typeof nft[field] === "string") {
        const url = nft[field];
        console.log(`Found model URL in direct field ${field}: ${url}`);
        
        // Check if it's a GLB file by extension or contains indicators
        if (isModelFile(url)) {
          return getAlternativeIpfsUrls(url)[0]; // Use first gateway
        }
      }
    }

    // STEP 2: Check model3dHash directly (as done in audio)
    if (nft.model3dHash) {
      console.log(`Found model3dHash: ${nft.model3dHash}`);
      return `/api/ipfs/${nft.model3dHash}`;
    }

    // STEP 3: Check metadata fields
    let metadata = nft.metadata;
    
    if (!metadata && nft.uri) {
      try {
        metadata = await fetchMetadataWithRetry(nft.uri);
        if (metadata) {
          // Cache metadata for future use
          nft.metadata = metadata;
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    }

    if (metadata) {
      // Check animation_url (common for 3D models)
      if (metadata.animation_url && isModelFile(metadata.animation_url)) {
        console.log(`Found model in animation_url: ${metadata.animation_url}`);
        return getAlternativeIpfsUrls(metadata.animation_url)[0];
      }

      // Check all possible metadata locations
      for (const field of directModelFields) {
        if (metadata[field] && typeof metadata[field] === "string" && isModelFile(metadata[field])) {
          console.log(`Found model in metadata.${field}: ${metadata[field]}`);
          return getAlternativeIpfsUrls(metadata[field])[0];
        }
      }

      // Check properties.files
      if (metadata.properties?.files && Array.isArray(metadata.properties.files)) {
        const modelFile = metadata.properties.files.find((file: any) => {
          if (!file) return false;
          return (
            file.type === "model/gltf-binary" || 
            file.type === "model/gltf+json" ||
            (file.uri && isModelFile(file.uri)) ||
            (file.url && isModelFile(file.url))
          );
        });

        if (modelFile) {
          const modelUrl = modelFile.uri || modelFile.url;
          console.log(`Found model in properties.files: ${modelUrl}`);
          return getAlternativeIpfsUrls(modelUrl)[0];
        }
      }

      // Check for attributes that might contain model URLs (similar to audio)
      if (Array.isArray(metadata.attributes)) {
        const modelAttr = metadata.attributes.find((attr: any) => {
          if (!attr || !attr.trait_type) return false;
          const traitType = attr.trait_type.toLowerCase();
          return (
            traitType.includes("model") ||
            traitType === "3d" ||
            traitType === "3d model"
          );
        });
        
        if (modelAttr?.value && typeof modelAttr.value === "string" && isModelFile(modelAttr.value)) {
          console.log(`Found model URL in attributes: ${modelAttr.value}`);
          return getAlternativeIpfsUrls(modelAttr.value)[0];
        }
      }
    }

    // If we got here, this is a cube NFT without a model, so generate one
    if (isVoidCube) {
      // Extract color, texture and animation - using same code as above
      const attributes = nft.attributes || nft.metadata?.attributes || [];
      
      let color = "ff66cc"; // Default pink
      const colorAttr = attributes.find((attr: any) => attr.trait_type === "Color");
      if (colorAttr?.value) {
        color = colorAttr.value.replace('#', '');
      } else if (nft.color) {
        color = nft.color.replace('#', '');
      }
      
      let texture = "default";
      const textureAttr = attributes.find((attr: any) => attr.trait_type === "Texture");
      if (textureAttr?.value) {
        texture = textureAttr.value.toLowerCase();
      }
      
      let animation = "none";
      const animationAttr = attributes.find((attr: any) => attr.trait_type === "Animation");
      if (animationAttr?.value) {
        animation = animationAttr.value.toLowerCase();
      } else if (nft.animation) {
        animation = nft.animation.toLowerCase();
      }
      
      console.log(`Generating dynamic cube with color=${color}, texture=${texture}, animation=${animation}`);
      return `/api/cube/${color}?texture=${texture}&animation=${animation}`;
    }

    console.log("No model URL found for this NFT");
    return null;
  } catch (error) {
    console.error("Error processing model URL:", error);
    return null;
  }
};

// Helper function to check if an NFT is part of a known VOID Cube collection
function isKnownVoidCubeCollection(nft: any): boolean {
  // Check for collection in metadata
  if (nft.metadata?.collection?.name === "VOID Cube Collection") {
    return true;
  }
  
  // Check for collection in properties
  if (nft.metadata?.properties?.collection?.name === "VOID Cube Collection") {
    return true;
  }
  
  // Check for collection in attributes
  if (nft.metadata?.attributes) {
    const collectionAttr = nft.metadata.attributes.find(
      (attr: any) => attr.trait_type === "Collection" && attr.value === "VOID Cube Collection"
    );
    if (collectionAttr) {
      return true;
    }
  }
  
  // Check name pattern
  if (nft.name && nft.name.match(/VOID Cube \d+/)) {
    return true;
  }
  
  return false;
}

// Helper function to potentially generate a model CID from NFT data
// This is a placeholder - in a real implementation, you'd need to know the 
// actual mapping pattern for your specific collection
function generateModelCidFromNft(nft: any): string | null {
  // This would need to be customized based on your specific collection's model mapping
  // This is just an example implementation
  if (!nft.id && !nft.mintAddress) return null;
  
  // Example: Use the NFT ID to map to a specific model CID pattern
  // This is just a placeholder - you'd need to replace with your actual mapping logic
  const idHash = nft.id || nft.mintAddress;
  
  // If your collection has a consistent pattern for model CIDs based on NFT ID,
  // you would implement that here
  
  // For testing, just return null
  return null;
}

// Function to log detailed NFT information for debugging
function logNFTDetails(nft: any) {
  console.log(`------- NFT DETAILS: ${nft.name || nft.id} -------`);
  
  // Basic info
  console.log(`Name: ${nft.name}`);
  console.log(`ID/Address: ${nft.id || nft.mintAddress}`);
  
  // URI and metadata
  console.log(`URI: ${nft.uri || "N/A"}`);
  
  // Check if metadata exists
  if (nft.metadata) {
    console.log(`Metadata summary: ${Object.keys(nft.metadata).join(", ")}`);
    
    // Look for important fields
    if (nft.metadata.image) console.log(`Image: ${nft.metadata.image}`);
    if (nft.metadata.animation_url) console.log(`Animation URL: ${nft.metadata.animation_url}`);
    if (nft.metadata.model3d) console.log(`Model3D: ${nft.metadata.model3d}`);
    if (nft.metadata.model) console.log(`Model: ${nft.metadata.model}`);
    
    // Properties
    if (nft.metadata.properties) {
      console.log(`Properties: ${Object.keys(nft.metadata.properties).join(", ")}`);
      
      // Check for files
      if (nft.metadata.properties.files && Array.isArray(nft.metadata.properties.files)) {
        console.log("Files:");
        nft.metadata.properties.files.forEach((file: any, idx: number) => {
          if (typeof file === "object") {
            console.log(`  File ${idx}: Type=${file.type}, URI=${file.uri || file.url || "N/A"}`);
          } else {
            console.log(`  File ${idx}: ${file}`);
          }
        });
      }
      
      // Check for material params
      if (nft.metadata.properties.materialParams) {
        console.log(`Material Params: ${JSON.stringify(nft.metadata.properties.materialParams)}`);
      }
    }
    
    // Attributes
    if (nft.metadata.attributes && Array.isArray(nft.metadata.attributes)) {
      console.log("Attributes:");
      nft.metadata.attributes.forEach((attr: any) => {
        console.log(`  ${attr.trait_type}: ${attr.value}`);
      });
    }
  } else {
    console.log("No metadata available");
  }
  
  console.log("------------------------------------");
}

function getAlternativeIpfsUrls(ipfsUri: string): string[] {
  if (!ipfsUri) return [];
  
  // Extract the IPFS hash/CID
  let ipfsHash = ipfsUri;

  // Handle ipfs:// protocol URLs
  if (ipfsUri.startsWith("ipfs://")) {
    ipfsHash = ipfsUri.replace("ipfs://", "");
  }
  // Handle https://ipfs.io/ipfs/ style URLs
  else if (ipfsUri.includes("/ipfs/")) {
    const parts = ipfsUri.split("/ipfs/");
    if (parts.length >= 2) {
      ipfsHash = parts[1];
    }
  }

  // Clean any query parameters or trailing slashes
  ipfsHash = ipfsHash.split("?")[0].split("#")[0].replace(/\/$/, "");

  // Generate the full list of alternatives, prioritizing our API endpoint first
  return [
    `/api/ipfs/${ipfsHash}`, // Local API endpoint - use this first
    `https://nftstorage.link/ipfs/${ipfsHash}`, 
    `https://dweb.link/ipfs/${ipfsHash}`,
    `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
    `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    `https://ipfs.io/ipfs/${ipfsHash}`,
    `https://gateway.ipfs.io/ipfs/${ipfsHash}`,
    `https://w3s.link/ipfs/${ipfsHash}`,
  ];
}

async function fetchMetadataWithRetry(uri: string, retries = 3): Promise<any> {
  if (!uri) return null;
  
  // For IPFS URIs, try alternative gateways
  if (uri.includes("/ipfs/") || uri.startsWith("ipfs://")) {
    const altUrls = getAlternativeIpfsUrls(uri);
    console.log(`Generated ${altUrls.length} alternative URLs for IPFS content`);
    
    // Try each URL until one works
    for (const url of altUrls) {
      try {
        console.log(`Trying URL: ${url}`);
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log(`Successfully fetched metadata from: ${url}`);
          return data;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${url}:`, error);
        // Continue to next URL
      }
    }
    
    console.error(`All IPFS gateways failed for ${uri}`);
    return null;
  }
  
  // For non-IPFS URLs, use standard retry logic
  let attempt = 0;
  while (attempt < retries) {
    try {
      console.log(`Fetching attempt ${attempt + 1}/${retries}`);
      const response = await fetch(uri);
      if (response.ok) {
        const data = await response.json();
        console.log(`Successfully fetched metadata`);
        return data;
      }
    } catch (error) {
      console.warn(`Fetch error (attempt ${attempt + 1}/${retries}):`, error);
    }
    
    attempt++;
    if (attempt < retries) {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  console.error(`Failed to fetch metadata after ${retries} attempts`);
  return null;
}

// Helper to check if a URL points to a 3D model file
function isModelFile(url: string): boolean {
  if (!url) return false;

  const lowerUrl = url.toLowerCase();

  // Check file extensions
  if (
    lowerUrl.endsWith(".glb") ||
    lowerUrl.endsWith(".gltf") ||
    lowerUrl.endsWith(".babylon") ||
    lowerUrl.endsWith(".obj")
  ) {
    return true;
  }

  // Check for model indicators in URL
  if (
    (lowerUrl.includes("model") ||
      lowerUrl.includes("3d") ||
      lowerUrl.includes("cube")) &&
    (lowerUrl.includes("gltf") ||
      lowerUrl.includes("glb") ||
      lowerUrl.includes("3d"))
  ) {
    return true;
  }

  // Check for content-type indicators
  if (
    lowerUrl.includes("type=model/") ||
    lowerUrl.includes("content-type=model/") ||
    lowerUrl.includes("model/gltf")
  ) {
    return true;
  }

  return false;
}

// Enhanced function to load the model and update cube
const loadAndApplyModel = async (
  cube: THREE.Mesh,
  modelUrl: string,
  colors: string[],
  onError?: (error: any) => void
): Promise<boolean> => {
  try {
    console.log(`Loading 3D model from URL: ${modelUrl}`);

    // Create a loader with better debugging
    const loader = new GLTFLoader();

    // Try loading the model with timeouts
    const loadModel = async (url: string, timeout = 15000): Promise<any> => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Timeout loading model from ${url}`));
        }, timeout);

        loader.load(
          url,
          (gltf) => {
            clearTimeout(timer);
            resolve(gltf);
            console.log(`Successfully loaded model from ${url}`);
          },
          (progress) => {
            // Calculate progress percentage when total is available
            if (progress.total > 0) {
              const percent = Math.round(
                (progress.loaded / progress.total) * 100
              );
              console.log(`Loading model progress: ${percent}%`);
            } else {
              console.log(`Loading model: ${progress.loaded} bytes`);
            }
          },
          (error) => {
            clearTimeout(timer);
            reject(error);
          }
        );
      });
    };

    // Try to load the model with fallbacks
    let gltf: GLTF | null = null;
    let error: any;

    // Get fallback URLs in case the primary URL fails
    const fallbackUrls = getModelFallbackUrls(modelUrl);

    // Try each URL until one works
    for (let i = 0; i < fallbackUrls.length; i++) {
      const url = fallbackUrls[i];
      try {
        console.log(`Trying model URL ${i + 1}/${fallbackUrls.length}: ${url}`);
        gltf = await loadModel(url);
        if (gltf) {
          console.log(`Successfully loaded model from URL: ${url}`);
          break; // Success, exit the loop
        }
      } catch (err) {
        error = err;
        console.warn(`Failed to load model from ${url}:`, err);
        // Continue to next URL
      }
    }

    // If all URLs failed, throw the last error
    if (!gltf) {
      throw error || new Error("Failed to load model from all URLs");
    }

    console.log(`Model loaded successfully, processing...`);

    // Extract both geometry and materials from the model
    const extractedColors: string[] = [];
    let extractedGeometry: THREE.BufferGeometry | null = null;
    let hasFoundMesh = false;

    gltf.scene.traverse((child: any) => {
      if (child instanceof THREE.Mesh) {
        console.log(`Found mesh in model: ${child.name || "unnamed"}`);
        hasFoundMesh = true;

        // Keep the first mesh geometry we find if not already set
        if (!extractedGeometry) {
          extractedGeometry = child.geometry.clone();
        }

        // Extract materials and colors
        if (child.material) {
          if (Array.isArray(child.material)) {
            console.log(`Model has ${child.material.length} materials`);
            child.material.forEach((mat: any, index: number) => {
              if (mat.color) {
                const hexColor = new THREE.Color(mat.color).getHexString();
                console.log(`Material ${index} color: #${hexColor}`);
                extractedColors[index] = `#${hexColor}`;
              }
            });
          } else if (child.material.color) {
            const hexColor = new THREE.Color(
              child.material.color
            ).getHexString();
            console.log(`Model single material color: #${hexColor}`);
            extractedColors[0] = `#${hexColor}`;
          }
        }
      }
    });

    // If we found colors in the model, use them instead of the defaults
    if (extractedColors.length > 0) {
      console.log(
        `Using ${extractedColors.length} colors extracted from model`
      );

      // Fill in missing colors if needed
      while (extractedColors.length < 6) {
        const lastColor =
          extractedColors[extractedColors.length - 1] || extractedColors[0];
        if (!lastColor) break; // Safety check

        const newColor = adjustColorBrightness(
          lastColor,
          -0.1 * extractedColors.length
        );
        extractedColors.push(newColor);
      }

      // Replace original colors with extracted ones
      for (
        let i = 0;
        i < Math.min(colors.length, extractedColors.length);
        i++
      ) {
        if (extractedColors[i]) {
          colors[i] = extractedColors[i];
        }
      }
    }

    // Apply geometry from the loaded model if available
    if (extractedGeometry && cube.geometry) {
      console.log(`Replacing cube geometry with model geometry`);

      // Dispose of the old geometry to prevent memory leaks
      if (cube.geometry instanceof THREE.BufferGeometry) {
        cube.geometry.dispose();
      }

      // Apply the new geometry
      cube.geometry = extractedGeometry;
    } else if (!hasFoundMesh) {
      console.warn("No meshes found in the loaded model");
    }

    // Apply materials/colors to the cube
    if (cube.material) {
      if (Array.isArray(cube.material)) {
        // For multi-material cubes
        cube.material.forEach((mat, index) => {
          if (mat instanceof THREE.Material && colors[index]) {
            if ("color" in mat && mat.color instanceof THREE.Color) {
              mat.color.set(colors[index]);
              mat.needsUpdate = true;
            }
          }
        });
      } else if (cube.material instanceof THREE.Material) {
        // For single material cubes
        if (
          "color" in cube.material &&
          cube.material.color instanceof THREE.Color
        ) {
          cube.material.color.set(colors[0]);
          cube.material.needsUpdate = true;
        }
      }
    }

    console.log(`Successfully applied model and colors to cube`);
    return true;
  } catch (error) {
    console.error(`Error loading or applying model:`, error);

    // Call the error callback if provided
    if (onError) {
      onError(error);
    }

    return false;
  }
};

// New function to convert user NFTs to realm cube format
const convertNFTsToCubes = async (nfts: any[]) => {
  console.log(`Starting conversion of ${nfts.length} NFTs to cube format`);
  const cubes = [];

  // Process each NFT that could be a cube
  for (const nft of nfts) {
    try {
      console.log(`Processing NFT for cube conversion: ${nft.name || nft.id}`);

      // Extract or generate NFT colors
      let colors = null;

      // First try to extract from attributes (for VOID Cubes)
      const colorAttr = nft.attributes?.find(
        (attr: any) => attr.trait_type === "Color"
      );
      
      if (colorAttr?.value) {
        console.log(`Extracted color from attributes: ${colorAttr.value}`);
        colors = generateColorShades(colorAttr.value);
      }

      // If no color attribute, try extract from metadata
      if (!colors) {
        colors = await extractColorsFromNFT(nft);
      }

      // If still no colors, try from name
      if (!colors && nft.name) {
        const colorFromName = extractColorFromName(nft.name);
        if (colorFromName) {
          console.log(`Extracted color from name: ${colorFromName}`);
          colors = generateColorShades(colorFromName);
        }
      }

      // If still no colors, use default VOID purple
      if (!colors || colors.length === 0) {
        console.log("Using default VOID purple colors");
        colors = [
          "#8b5cf6",
          "#7243dd",
          "#5829c3",
          "#3f10aa",
          "#250090",
          "#0c0077",
        ];
      }

      // Get accent color from first color
      const accentColor = colors[0];

      // Extract model URL using our improved function
      const model3d = await processModelUrl(nft);
      if (model3d) {
        console.log(`Found 3D model URL: ${model3d}`);
      } else {
        console.log(`No 3D model found for NFT: ${nft.name || nft.id}`);
      }

      // Extract texture information for display
      const textureAttr = nft.attributes?.find(
        (attr: any) => attr.trait_type === "Texture"
      );
      const texture = textureAttr?.value || "";

      // Extract animation for special effects
      const animationAttr = nft.attributes?.find(
        (attr: any) => attr.trait_type === "Animation"
      );
      const animation = animationAttr?.value || "";

      // Assign rarity - all NFTs with models are at least rare
      let rarity = "common";
      if (model3d) {
        // Higher rarity for NFTs with custom 3D models
        rarity =
          nft.metadata?.attributes
            ?.find((a: any) => a.trait_type?.toLowerCase() === "rarity")
            ?.value?.toLowerCase() || "rare";
      }

      // Create border color and glow effect
      const borderColor = `rgba(${hexToRgb(accentColor)}, 0.5)`;
      const glow = `0 0 25px rgba(${hexToRgb(accentColor)}, 0.7)`;

      // Create the cube object with all extracted data
      const newCube = {
        id: `nft-${nft.id || nft.mintAddress || Date.now().toString()}`,
        name:
          nft.name ||
          `VOID Cube #${(nft.id || nft.mintAddress || "").slice(0, 6)}`,
        colors: colors,
        accentColor: accentColor,
        borderColor: borderColor,
        glow: glow,
        rarity: rarity,
        nftData: nft,
        model3d: model3d,
        texture: texture,
        animation: animation,
        isNFT: true,
      };

      console.log(`Created RealmCube:`, {
        id: newCube.id,
        name: newCube.name,
        colors: newCube.colors.slice(0, 2), // Log just a couple colors
        model3d: model3d ? "Present" : "None",
        texture: texture,
        animation: animation,
      });

      cubes.push(newCube);
    } catch (error) {
      console.error(
        `Error converting NFT to cube: ${nft.id || nft.name}`,
        error
      );
    }
  }

  console.log(`Converted ${cubes.length} NFTs to RealmCubes`);
  return cubes;
};



// Helper to convert hex to rgb for rgba strings
const hexToRgb = (hex: string) => {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `${r}, ${g}, ${b}`;
};

// Helper to adjust color brightness
const adjustColorBrightness = (hexColor: string, factor: number): string => {
  // Remove # if present
  hexColor = hexColor.replace(/^#/, "");

  // Parse hex values
  let r = parseInt(hexColor.substring(0, 2), 16);
  let g = parseInt(hexColor.substring(2, 4), 16);
  let b = parseInt(hexColor.substring(4, 6), 16);

  // Adjust brightness
  r = Math.min(255, Math.max(0, Math.round(r + factor * 255)));
  g = Math.min(255, Math.max(0, Math.round(g + factor * 255)));
  b = Math.min(255, Math.max(0, Math.round(b + factor * 255)));

  // Convert back to hex
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

function getModelFallbackUrls(modelUrl: string): string[] {
  // If it's not an IPFS URL, just return the original
  if (!modelUrl.includes("ipfs") && !modelUrl.includes("/ipfs/")) {
    return [modelUrl];
  }

  // Extract IPFS hash
  let ipfsHash: string;

  if (modelUrl.startsWith("ipfs://")) {
    ipfsHash = modelUrl.replace("ipfs://", "").split("?")[0].split("#")[0];
  } else if (modelUrl.includes("/ipfs/")) {
    ipfsHash = modelUrl.split("/ipfs/")[1].split("?")[0].split("#")[0];
  } else if (modelUrl.startsWith("/api/ipfs/")) {
    // Already using our API endpoint
    return [modelUrl];
  } else {
    // Not a recognized IPFS URL format
    return [modelUrl];
  }

  // Clean any trailing slashes
  ipfsHash = ipfsHash.replace(/\/+$/, "");

  // Return multiple options in order of preference
  return [
    `/api/ipfs/${ipfsHash}`, // Our local API endpoint (best option)
    `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
    `https://ipfs.io/ipfs/${ipfsHash}`,
    `https://ipfs.filebase.io/ipfs/${ipfsHash}`,
    `ipfs://${ipfsHash}`, // Original ipfs:// format as last resort
  ];
}

// Cube component for rendering a single 3D cube
const Cube: React.FC<{
  colors: string[];
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  glow?: string;
  isHovered?: boolean;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  model3d?: string | null;
}> = ({
  colors,
  size = 64,
  borderWidth = 1,
  borderColor = "rgba(255, 255, 255, 0.3)",
  glow = "",
  isHovered = false,
  rotateX = 15,
  rotateY = 15,
  rotateZ = 0,
  model3d = null,
}) => {
  // Calculate half of the size for translateZ values
  const halfSize = size / 2;
  const modelRef = useRef<HTMLDivElement>(null);

  // Use useEffect to load 3D model if available instead of basic cube
  useEffect(() => {
    if (model3d && modelRef.current) {
      // Clear any existing content
      while (modelRef.current.firstChild) {
        modelRef.current.removeChild(modelRef.current.firstChild);
      }

      try {
        // Create scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
        });

        // Configure renderer
        renderer.setSize(size, size);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        modelRef.current.appendChild(renderer.domElement);

        // Position camera
        camera.position.z = 2;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Extract the original modelUrl and possible fallback URLs
        let modelUrl = model3d;
        let fallbackUrls: string[] = [];

        // Get all alternative URLs for this model
        if (modelUrl.includes("/ipfs/") || modelUrl.startsWith("ipfs://")) {
          fallbackUrls = getAlternativeIpfsUrls(modelUrl);
          // Use the first URL as the main one
          if (fallbackUrls.length > 0) {
            modelUrl = fallbackUrls[0];
            fallbackUrls = fallbackUrls.slice(1); // Remove the first one as we're using it
          }
        }

        console.log(`Trying to load model from: ${modelUrl}`);
        console.log(`Have ${fallbackUrls.length} fallback URLs if needed`);

        // Load the model with retries
        const loadModelWithRetries = async () => {
          const loader = new GLTFLoader();
          let lastError = null;

          // Try the main URL first
          try {
            const gltf = await new Promise((resolve, reject) => {
              loader.load(modelUrl, resolve, undefined, reject);
            });
            return gltf;
          } catch (mainError) {
            console.warn(
              `Error loading model from primary URL: ${modelUrl}`,
              mainError
            );
            lastError = mainError;

            // Try each fallback URL
            for (const fallbackUrl of fallbackUrls) {
              try {
                console.log(`Trying fallback URL: ${fallbackUrl}`);
                const gltf = await new Promise((resolve, reject) => {
                  loader.load(fallbackUrl, resolve, undefined, reject);
                });
                console.log(
                  `Successfully loaded model from fallback: ${fallbackUrl}`
                );
                return gltf;
              } catch (fallbackError) {
                console.warn(
                  `Fallback URL failed: ${fallbackUrl}`,
                  fallbackError
                );
                lastError = fallbackError;
                // Continue to next fallback
              }
            }

            // If we get here, all URLs failed
            throw lastError || new Error("All model URLs failed to load");
          }
        };

        // Try to load with our retry logic
        loadModelWithRetries()
          .then((gltf) => {
            console.log("Successfully loaded 3D model!");

            // Center and scale the model
            const box = new THREE.Box3().setFromObject((gltf as GLTF).scene);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.5 / maxDim;

            (gltf as GLTF).scene.position.x = -center.x * scale;
            (gltf as GLTF).scene.position.y = -center.y * scale;
            (gltf as GLTF).scene.position.z = -center.z * scale;
            (gltf as GLTF).scene.scale.multiplyScalar(scale);

            // Add model to scene
            scene.add((gltf as GLTF).scene);

            // Animation loop
            const animate = () => {
              requestAnimationFrame(animate);

              // Apply rotation from props
              (gltf as GLTF).scene.rotation.x =
                THREE.MathUtils.degToRad(rotateX);
              (gltf as GLTF).scene.rotation.y =
                THREE.MathUtils.degToRad(rotateY);
              (gltf as GLTF).scene.rotation.z =
                THREE.MathUtils.degToRad(rotateZ);

              renderer.render(scene, camera);
            };

            animate();
          })
          .catch((error) => {
            console.error("All model loading attempts failed:", error);

            // Create a colored cube as a last resort
            console.log("Creating colored cube with NFT colors:", colors);
            const geometry = new THREE.BoxGeometry(1, 1, 1);

            // Create materials for each face using the NFT's colors
            const materials = colors.map((color, index) => {
              return new THREE.MeshStandardMaterial({
                color: new THREE.Color(color),
                metalness: 0.3,
                roughness: 0.6,
              });
            });

            // Ensure we have 6 materials (one for each face)
            while (materials.length < 6) {
              materials.push(materials[materials.length - 1].clone());
            }

            const cube = new THREE.Mesh(geometry, materials);
            scene.add(cube);

            // Animation loop for the fallback cube
            const animate = () => {
              requestAnimationFrame(animate);
              cube.rotation.x = THREE.MathUtils.degToRad(rotateX);
              cube.rotation.y = THREE.MathUtils.degToRad(rotateY);
              cube.rotation.z = THREE.MathUtils.degToRad(rotateZ);
              renderer.render(scene, camera);
            };

            animate();
          });
      } catch (error) {
        console.error("Error initializing model viewer:", error);
      }

      // Cleanup function
      return () => {
        if (modelRef.current && modelRef.current.firstChild) {
          modelRef.current.removeChild(modelRef.current.firstChild);
        }
      };
    }
  }, [model3d, size, isHovered, colors, glow, rotateX, rotateY, rotateZ]);

  if (model3d) {
    return (
      <div
        ref={modelRef}
        className="cube-scene model-container"
        style={{ width: size, height: size }}
      >
        {/* The model will be loaded here */}
        <div
          className="model-loading-fallback"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.2)",
            color: colors[0] || "#ffffff",
            fontSize: "10px",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="cube-scene" style={{ width: size, height: size }}>
      <div
        className="cube"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
          width: size,
          height: size,
          ["--cube-size" as string]: `${size}px`,
        }}
      >
        {/* Front face */}
        <div
          className="cube-face cube-face-front"
          style={{
            backgroundColor: colors[0],
            borderWidth,
            borderColor,
            boxShadow: isHovered ? glow : "none",
          }}
        />

        {/* Back face */}
        <div
          className="cube-face cube-face-back"
          style={{
            backgroundColor: colors[1],
            borderWidth,
            borderColor,
          }}
        />

        {/* Right face */}
        <div
          className="cube-face cube-face-right"
          style={{
            backgroundColor: colors[2],
            borderWidth,
            borderColor,
          }}
        />

        {/* Left face */}
        <div
          className="cube-face cube-face-left"
          style={{
            backgroundColor: colors[3],
            borderWidth,
            borderColor,
          }}
        />

        {/* Top face */}
        <div
          className="cube-face cube-face-top"
          style={{
            backgroundColor: colors[4],
            borderWidth,
            borderColor,
          }}
        />

        {/* Bottom face */}
        <div
          className="cube-face cube-face-bottom"
          style={{
            backgroundColor: colors[5],
            borderWidth,
            borderColor,
          }}
        />
      </div>
    </div>
  );
};

// OPTIMIZED VERSION: Avoid re-renders with React.memo
// Modified AnimatedCube to prevent unnecessary re-renders
interface AnimatedCubeProps {
  colors: string[];
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  glow?: string;
  isHovered?: boolean;
  animate?: boolean;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  model3d?: string | null;
}

const AnimatedCube: React.FC<AnimatedCubeProps> = React.memo(
  ({
    colors,
    size = 64,
    borderWidth = 1,
    borderColor = "rgba(255, 255, 255, 0.3)",
    glow = "",
    isHovered = false,
    animate = false,
    rotateX = 15,
    rotateY = 15,
    rotateZ = 0,
    model3d = null,
  }) => {
    return (
      <motion.div className="cube-scene" style={{ width: size, height: size }}>
        <motion.div
          className="cube"
          style={{
            width: size,
            height: size,
            ["--cube-size" as string]: `${size}px`,
          }}
          animate={
            animate
              ? {
                  rotateX: rotateX,
                  rotateY: rotateY, // Fixed: don't use hover-based animation
                  rotateZ: rotateZ,
                }
              : {
                  rotateX,
                  rotateY,
                  rotateZ,
                }
          }
          transition={{
            duration: 0.5,
          }}
        >
          {model3d ? (
            <Cube
              colors={colors}
              size={size}
              borderWidth={borderWidth}
              borderColor={borderColor}
              glow={glow}
              isHovered={isHovered}
              rotateX={rotateX}
              rotateY={rotateY}
              rotateZ={rotateZ}
              model3d={model3d}
            />
          ) : (
            <>
              {/* Cube faces */}
              {[
                { face: "front", color: colors[0] },
                { face: "back", color: colors[1] },
                { face: "right", color: colors[2] },
                { face: "left", color: colors[3] },
                { face: "top", color: colors[4] },
                { face: "bottom", color: colors[5] },
              ].map(({ face, color }) => (
                <div
                  key={face}
                  className={`cube-face cube-face-${face}`}
                  style={{
                    backgroundColor: color,
                    borderWidth,
                    borderColor,
                    boxShadow: face === "front" && isHovered ? glow : "none",
                  }}
                />
              ))}
            </>
          )}
        </motion.div>
      </motion.div>
    );
  },
  // Custom equality check to minimize re-renders
  (prevProps, nextProps) => {
    // Only re-render if important props change
    return (
      prevProps.size === nextProps.size &&
      prevProps.colors.join() === nextProps.colors.join() &&
      prevProps.borderColor === nextProps.borderColor &&
      prevProps.model3d === nextProps.model3d &&
      prevProps.animate === nextProps.animate
      // Intentionally NOT comparing isHovered to avoid re-renders on hover
    );
  }
);

// OPTIMIZED VERSION: Move outside of main component
// The MemoizedCubeCard component
const MemoizedCubeCard = React.memo(
  ({
    cube,
    isSelected,
    onCubeSelect,
  }: {
    cube: any;
    isSelected: boolean;
    onCubeSelect: (id: string) => void;
  }) => {
    // Use refs instead of state to prevent re-renders
    const cardRef = useRef<HTMLDivElement>(null);
    const rarity = getRarityStyles(cube.rarity);
    const [localHovered, setLocalHovered] = useState(false);

    return (
      <motion.div
        ref={cardRef}
        key={cube.id}
        className="relative bg-black/30 border border-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all group"
        whileHover={{
          scale: 1.03,
          borderColor: cube.accentColor,
        }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onCubeSelect(cube.id)}
        onMouseEnter={() => setLocalHovered(true)}
        onMouseLeave={() => setLocalHovered(false)}
        style={{
          boxShadow: localHovered ? `0 0 20px ${cube.accentColor}40` : "none",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none"></div>

        <div className="aspect-square w-full relative p-6 flex items-center justify-center">
          <AnimatedCube
            colors={cube.colors}
            size={110}
            borderWidth={1}
            borderColor={cube.borderColor}
            glow={cube.glow}
            isHovered={localHovered}
            animate={true}
            rotateX={15}
            rotateY={25}
            rotateZ={0}
            model3d={cube.model3d}
          />
        </div>

        <div className="p-4 flex justify-between items-center border-t border-gray-800 relative z-10 bg-black/50 backdrop-blur-sm">
          <h3 className="font-bold text-white font-pixel">{cube.name}</h3>
          <span
            className="text-xs px-2 py-1 rounded border text-center transition-colors font-pixel"
            style={{
              color: rarity.color,
              borderColor: rarity.color,
              background: `${rarity.color}10`,
            }}
          >
            {rarity.label}
          </span>
        </div>

        {/* NFT badge if it's an NFT cube */}
        {cube.isNFT && (
          <div className="absolute top-3 left-3 bg-purple-600 rounded-md px-2 py-0.5 text-xs text-white font-pixel">
            NFT
          </div>
        )}

        {isSelected && (
          <motion.div
            className="absolute top-3 right-3 bg-green-500 rounded-full p-1.5 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </motion.div>
        )}
      </motion.div>
    );
  },
  // Proper equality check to prevent unnecessary rerenders
  (prevProps, nextProps) => {
    // Only re-render if selected state changes or if the cube ID changes
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.cube.id === nextProps.cube.id
    );
  }
);

// OPTIMIZED VERSION: Move outside of main component
// The PortalModal component
const PortalModal = React.memo(
  ({
    children,
    isOpen,
    onClose,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;

    // Create portal only when open
    return ReactDOM.createPortal(
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200]"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  },
  // Custom comparison to only update when open state changes
  (prevProps, nextProps) => {
    return prevProps.isOpen === nextProps.isOpen;
  }
);

interface RealmCubeProps {
  position?: "corner" | "center"; // Position on screen
  size?: number; // Size in pixels
  primaryColor?: string; // Primary color override
  cubeId?: string; // Selected cube
  isAnimated?: boolean;
  onCubeChange?: (cubeId: string) => void; // Cube change handler
  onCubeClick?: () => void; // Alternative click handler
  interactable?: boolean;
  onCubeInteractionStart?: () => void;
  onCubeInteractionEnd?: () => void;
  colors?: string[];
}

const RealmCube: React.FC<RealmCubeProps> = ({
  position = "corner",
  size = 64,
  primaryColor,
  cubeId = "pink-neon",
  onCubeChange,
  onCubeClick,
}) => {
  const wallet = useWallet();
  // States
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedCubeId, setSelectedCubeId] = useState(cubeId);
  const [combinedCubeCollection, setCombinedCubeCollection] =
    useState(cubeCollection);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [activeTab, setActiveTab] = useState("default"); // "default" or "nft"

  // Debug log when activeTab changes
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
  }, [activeTab]);

  // Debug log when combined collection changes
  useEffect(() => {
    console.log(
      "Combined collection updated, total:",
      combinedCubeCollection.length
    );
    console.log(
      "NFT cubes:",
      combinedCubeCollection.filter((cube) => cube.isNFT).length
    );
    console.log(
      "Default cubes:",
      combinedCubeCollection.filter((cube) => !cube.isNFT).length
    );
  }, [combinedCubeCollection]);

  useEffect(() => {
    console.log(
      "RealmCube - Wallet status:",
      wallet.connected ? "Connected" : "Disconnected"
    );
    if (wallet.publicKey) {
      console.log(
        "RealmCube - Wallet public key:",
        wallet.publicKey.toString()
      );
    }
  }, [wallet.connected, wallet.publicKey]);

  // Load NFT cubes from blockchain only on first render
  useEffect(() => {
    const loadNFTCubesFromBlockchain = async () => {
      try {
        setIsLoadingNFTs(true);
    
        // First try to load from wallet
        if (wallet.connected && wallet.publicKey) {
          try {
            // Get the public key from the connected wallet
            const publicKey = wallet.publicKey;
    
            // Import libraries dynamically
            const { Connection, PublicKey } = await import("@solana/web3.js");
            const { Metaplex } = await import("@metaplex-foundation/js");
    
            // Set up connection
            const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
            const endpoint =
              network === "mainnet-beta"
                ? "https://api.mainnet-beta.solana.com"
                : "https://api.devnet.solana.com";
            const connection = new Connection(endpoint);
    
            // Initialize Metaplex
            const metaplex = Metaplex.make(connection);
    
            console.log(
              `Loading NFTs from blockchain for wallet: ${publicKey.toString()}`
            );
    
            // Fetch NFTs owned by this wallet
            const nfts = await metaplex.nfts().findAllByOwner({
              owner: new PublicKey(publicKey),
            });
    
            console.log(`Found ${nfts.length} total NFTs in wallet`);
    
            // Process all NFTs - we'll filter cube-specific ones later
            if (nfts.length > 0) {
              // Process in batches to avoid overwhelming the network
              const batchSize = 5;
              const allNfts = [];
              const cubeNfts: any[] = [];
              
              // Process in batches
              for (let i = 0; i < nfts.length; i += batchSize) {
                const batch = nfts.slice(i, i + batchSize);
                console.log(`Processing NFT batch ${i/batchSize + 1}/${Math.ceil(nfts.length/batchSize)}`);
                
                const batchResults = await Promise.all(
                  batch.map(async (nft) => {
                    try {
                      // Try to fetch metadata if available
                      let metadata = null;
    
                      if (nft.uri) {
                        try {
                          console.log(`Fetching metadata from: ${nft.uri}`);
                          // Use our improved metadata fetching function
                          metadata = await fetchMetadataWithRetry(nft.uri);
                          
                          if (metadata) {
                            console.log(`Got metadata for: ${metadata.name || nft.name || nft.address.toString()}`);
                          } else {
                            console.warn(`Failed to fetch metadata for ${nft.uri}`);
                          }
                        } catch (metadataError) {
                          console.warn(
                            `Error fetching metadata for NFT ${nft.address.toString()}:`,
                            metadataError
                          );
                        }
                      }
    
                      // Use JSON data if it's already available in the nft object
                      if (!metadata && nft.json) {
                        metadata = nft.json;
                        console.log(
                          `Using embedded JSON data for: ${
                            nft.name || nft.address.toString()
                          }`
                        );
                      }
    
                      // Create basic NFT object with all available data
                      const processedNft: {
                        id: string;
                        name: any;
                        description: any;
                        image: any;
                        attributes: any;
                        metadata: any;
                        json: any;
                        mintAddress: string;
                        uri: string;
                        isCube?: boolean;
                      } = {
                        id: nft.address.toString(),
                        name:
                          metadata?.name ||
                          nft.name ||
                          `NFT #${nft.address.toString().slice(0, 6)}`,
                        description: metadata?.description || "A unique NFT",
                        image: metadata?.image || nft.json?.image,
                        attributes: metadata?.attributes || nft.json?.attributes || [],
                        metadata: metadata || nft.json || {},
                        json: nft.json || metadata || {},
                        mintAddress: nft.address.toString(),
                        uri: nft.uri,
                      };
    
                      // Enhanced VOID cube detection - check various patterns
                      const isCube =
                        // Check name
                        (processedNft.name?.includes("VOID") &&
                          processedNft.name?.includes("Cube")) ||
                        // Check collection name
                        processedNft.metadata?.collection?.name?.includes("VOID Cube") ||
                        // Check collection family
                        processedNft.metadata?.collection?.family?.includes("VOID Cube") ||
                        // Check properties.collection
                        processedNft.metadata?.properties?.collection?.name?.includes("VOID Cube") ||
                        // Check explicit type in attributes
                        processedNft.attributes?.some((attr: any) =>
                          (attr.trait_type === "Type" && attr.value === "Cube") ||
                          (attr.trait_type === "Collection" && attr.value?.includes("VOID Cube"))
                        );
    
                      // Add isCube flag to the processedNft
                      processedNft.isCube = isCube;
                      
                      if (isCube) {
                        console.log(`Found VOID Cube NFT: ${processedNft.name}`);
                        cubeNfts.push(processedNft);
                      }
                      
                      // Add to all NFTs
                      allNfts.push(processedNft);
                      return processedNft;
                    } catch (error) {
                      console.error(`Error processing NFT ${nft.address.toString()}:`, error);
                      return null;
                    }
                  })
                );
              }
    
              console.log(
                `Successfully processed ${allNfts.length} NFTs, found ${cubeNfts.length} cubes`
              );
    
              // Convert NFTs to cube format
              const nftCubes = await convertNFTsToCubes(cubeNfts);
              console.log(`Converted ${nftCubes.length} NFTs into RealmCubes`);
    
              if (nftCubes.length > 0) {
                // Combine default and NFT cubes
                setCombinedCubeCollection([...cubeCollection, ...nftCubes]);
                setIsLoadingNFTs(false);
                return; // Successfully loaded, exit function
              }
            }
          } catch (walletError) {
            console.error("Error accessing blockchain or wallet:", walletError);
          }
        } else {
          console.log("No wallet connected or not initialized yet");
        }
    
        // If we get here, we couldn't load from blockchain or there were no cubes
        // Either show no NFT cubes or create mock ones for testing
        console.log("Creating mock NFT cubes for testing");
        const mockNftCubes = [
          {
            id: "nft-mock-1",
            name: "VOID Ruby Cube",
            colors: [
              "#ff0000",
              "#cc0000",
              "#990000",
              "#660000",
              "#330000",
              "#110000",
            ],
            accentColor: "#ff0000",
            borderColor: "rgba(255, 0, 0, 0.5)",
            glow: "0 0 25px rgba(255, 0, 0, 0.7)",
            rarity: "legendary",
            isNFT: true,
          },
          {
            id: "nft-mock-2",
            name: "VOID Sapphire Cube",
            colors: [
              "#0000ff",
              "#0000cc",
              "#000099",
              "#000066",
              "#000033",
              "#000011",
            ],
            accentColor: "#0000ff",
            borderColor: "rgba(0, 0, 255, 0.5)",
            glow: "0 0 25px rgba(0, 0, 255, 0.7)",
            rarity: "epic",
            isNFT: true,
          },
        ];
    
        setCombinedCubeCollection([...cubeCollection, ...mockNftCubes]);
      } catch (error) {
        console.error("Error in NFT loading process:", error);
      } finally {
        setIsLoadingNFTs(false);
      }
    };

    // Only load NFTs after wallet is initialized
    if (wallet) {
      loadNFTCubesFromBlockchain();
    }
  }, [wallet.connected, wallet.publicKey]);

  // Get the selected cube with useMemo to prevent unnecessary recalculations
  const selectedCube = useMemo(() => {
    return (combinedCubeCollection.find((cube) => cube.id === selectedCubeId) ||
      combinedCubeCollection[0]) as (typeof combinedCubeCollection)[0] & {
      model3d?: string | null;
    };
  }, [combinedCubeCollection, selectedCubeId]);

  // Apply primary color override if provided - also with useMemo
  const colors = useMemo(() => {
    const baseColors = [...selectedCube.colors];
    if (primaryColor) {
      baseColors[0] = primaryColor;
    }
    return baseColors;
  }, [selectedCube.colors, primaryColor]);

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Motion values for smooth animation
  const cubeRotateX = useMotionValue(15);
  const cubeRotateY = useMotionValue(15);
  const cubeRotateZ = useMotionValue(0);

  // Spring animations for smoother motion
  const springRotateX = useSpring(cubeRotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(cubeRotateY, { stiffness: 200, damping: 20 });
  const springRotateZ = useSpring(cubeRotateZ, { stiffness: 200, damping: 20 });

  // Auto-rotation animation
  useEffect(() => {
    let frameId: number;
    let angle = 0;

    const autoRotate = () => {
      angle += 0.01;
      cubeRotateY.set(15 + Math.sin(angle) * 25);
      cubeRotateX.set(15 + Math.cos(angle) * 15);
      cubeRotateZ.set(Math.sin(angle * 0.5) * 5);

      frameId = requestAnimationFrame(autoRotate);
    };

    frameId = requestAnimationFrame(autoRotate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Update parent component when selected cube changes
  useEffect(() => {
    if (cubeId !== selectedCubeId && cubeId) {
      setSelectedCubeId(cubeId);
    }
  }, [cubeId]);

  // Handle cube selection - use callback for stability
  const handleCubeSelect = useCallback(
    (id: string) => {
      setSelectedCubeId(id);
      if (onCubeChange) {
        onCubeChange(id);
      }
      setIsLibraryOpen(false);
    },
    [onCubeChange]
  );

  // Handle cube click - use callback for stability
  const handleCubeClick = useCallback(() => {
    // Make sure we're logging this to verify it's being called
    console.log("Cube clicked, opening library");
    setIsLibraryOpen(true);
  }, []);

  // IMPROVED TAB HANDLERS - The key fix for NFT tab navigation
  const switchToDefaultTab = useCallback(() => {
    console.log("Switching to default tab");
    setActiveTab("default");
  }, []);

  const switchToNftTab = useCallback(() => {
    console.log("Switching to NFT tab");
    setActiveTab("nft");
  }, []);

  // Memoize position styles to prevent recalculations
  const positionStyles = useMemo(
    () =>
      position === "corner"
        ? "fixed bottom-8 right-8"
        : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    [position]
  );

  const zIndexStyle = useMemo(
    () => (position === "corner" ? "z-50" : "z-[100]"),
    [position]
  );

  // Prevent background from scrolling when library is open
  useEffect(() => {
    if (isLibraryOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isLibraryOpen]);

  // Memoize filtered cubes with better debug logging
  const filteredCubes = useMemo(() => {
    const filtered =
      activeTab === "default"
        ? combinedCubeCollection.filter((cube) => !cube.isNFT)
        : combinedCubeCollection.filter((cube) => cube.isNFT);

    console.log(`Filtered cubes for tab '${activeTab}':`, filtered.length);
    return filtered;
  }, [combinedCubeCollection, activeTab]);

  // Memoize the cube grid content
  const cubeGridContent = useMemo(() => {
    if (isLoadingNFTs && activeTab === "nft") {
      return (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      );
    }

    if (filteredCubes.length === 0 && activeTab === "nft") {
      return (
        <div className="text-center py-10 font-pixel">
          <div className="text-gray-400 mb-4">
            You don't have any NFT cubes yet
          </div>
          <button
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-pixel"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = "/ai";
            }}
          >
            Create Cube NFT
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredCubes.map((cube) => (
          <MemoizedCubeCard
            key={cube.id}
            cube={cube}
            isSelected={selectedCubeId === cube.id}
            onCubeSelect={handleCubeSelect}
          />
        ))}
      </div>
    );
  }, [
    filteredCubes,
    activeTab,
    isLoadingNFTs,
    selectedCubeId,
    handleCubeSelect,
  ]);

  const fetchMetadata = async (uri: string, retries = 3): Promise<any> => {
    if (!uri) return null;

    let attempt = 0;
    while (attempt < retries) {
      try {
        console.log(
          `Fetching metadata from: ${uri} (attempt ${attempt + 1}/${retries})`
        );
        const response = await fetch(uri);
        if (response.ok) {
          const metadata = await response.json();
          console.log(`Successfully fetched metadata for URI: ${uri}`);
          return metadata;
        }
        attempt++;
      } catch (error) {
        console.warn(
          `Error fetching metadata (attempt ${attempt + 1}/${retries}):`,
          error
        );
        attempt++;
      }
      // Add delay between retries
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return null;
  };

  // Closure handler
  const handleCloseLibrary = useCallback(() => {
    setIsLibraryOpen(false);
  }, []);

  return (
    <>
      {/* The 3D Cube */}
      <motion.div
        ref={containerRef}
        className={`${positionStyles} ${zIndexStyle} cursor-pointer`}
        animate={{ scale: isLibraryOpen ? 0 : 1 }}
        onClick={handleCubeClick} // This should be the correct function
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Cube
          colors={colors}
          size={size}
          borderWidth={1}
          borderColor={selectedCube.borderColor}
          glow={selectedCube.glow}
          rotateX={springRotateX.get()}
          rotateY={springRotateY.get()}
          rotateZ={springRotateZ.get()}
          model3d={selectedCube.model3d}
        />
      </motion.div>

      {/* Cube Library Overlay */}
      <AnimatePresence mode="sync">
        {" "}
        {isLibraryOpen && (
          <div
            className="fixed inset-0 z-[200]"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsLibraryOpen(false)}
          >
            <div
              className="bg-black/60 border border-gray-800 rounded-xl p-6 max-w-4xl w-[calc(100%-2rem)] mx-4 flex flex-col font-pixel"
              style={{
                maxHeight: "85vh",
                boxShadow: "0 0 40px rgba(139, 92, 246, 0.2)",
                backdropFilter: "blur(10px)",
                position: "relative",
                top: 0,
                transform: "none",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white font-pixel">
                  Cube Collection
                </h2>
                <button
                  type="button"
                  className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
                  onClick={() => setIsLibraryOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Tabs for Default and NFT cubes */}
              <div className="flex space-x-2 mb-4">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm rounded-md transition-all font-pixel ${
                    activeTab === "default"
                      ? "bg-purple-900/50 text-white"
                      : "bg-transparent text-gray-400 hover:bg-purple-900/30 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("default")}
                >
                  Default Cubes
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm rounded-md transition-all font-pixel ${
                    activeTab === "nft"
                      ? "bg-purple-900/50 text-white"
                      : "bg-transparent text-gray-400 hover:bg-purple-900/30 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("nft")}
                >
                  Your NFT Cubes
                </button>
              </div>

              {/* Tab Content Container */}
              <div
                className="cube-collection-container overflow-y-auto"
                style={{ maxHeight: "calc(85vh - 10rem)" }}
              >
                {/* Default Cubes Tab Content */}
                {activeTab === "default" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {combinedCubeCollection
                      .filter((cube) => !cube.isNFT)
                      .map((cube) => (
                        <MemoizedCubeCard
                          key={cube.id}
                          cube={cube}
                          isSelected={selectedCubeId === cube.id}
                          onCubeSelect={handleCubeSelect}
                        />
                      ))}
                  </div>
                )}

                {/* NFT Cubes Tab Content */}
                {activeTab === "nft" && isLoadingNFTs ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : activeTab === "nft" &&
                  combinedCubeCollection.filter((cube) => cube.isNFT).length ===
                    0 ? (
                  <div className="text-center py-10 font-pixel">
                    <div className="text-gray-400 mb-4">
                      You don't have any NFT cubes yet
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-pixel"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = "/ai";
                      }}
                    >
                      Create Cube NFT
                    </button>
                  </div>
                ) : (
                  activeTab === "nft" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {combinedCubeCollection
                        .filter((cube) => cube.isNFT)
                        .map((cube) => (
                          <MemoizedCubeCard
                            key={cube.id}
                            cube={cube}
                            isSelected={selectedCubeId === cube.id}
                            onCubeSelect={handleCubeSelect}
                          />
                        ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Global styles */}
      <style jsx global>
        {cubeStyles}
      </style>
    </>
  );
};

export default RealmCube;
