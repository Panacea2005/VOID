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
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
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

function generateColorShades(baseColor: string) {
  return [
    baseColor,
    adjustColorBrightness(baseColor, -0.1),
    adjustColorBrightness(baseColor, -0.2),
    adjustColorBrightness(baseColor, -0.3),
    adjustColorBrightness(baseColor, -0.4),
    adjustColorBrightness(baseColor, -0.5),
  ];
}

// Helper function to extract colors from a model or create default colors
const extractColorsFromNFT = (nft: any): string[] => {
  // Default colors if we can't extract them
  const defaultColors = [
    "#8b5cf6",
    "#7c3aed",
    "#6d28d9",
    "#5b21b6",
    "#4c1d95",
    "#3a1078",
  ];

  console.log(`Extracting colors for NFT: ${nft.name || nft.id}`);
  console.log(
    "NFT data received:",
    JSON.stringify(nft).substring(0, 300) + "..."
  );

  try {
    // First check if NFT already has colors array
    if (nft.colors && Array.isArray(nft.colors) && nft.colors.length > 0) {
      console.log(
        `Found existing colors array in NFT: ${nft.colors.join(", ")}`
      );
      return nft.colors;
    }

    // Direct extraction from materialParams which is where we store color data during minting
    if (nft.materialParams) {
      console.log("Found materialParams in NFT data");

      // Check for color directly in materialParams
      if (nft.materialParams.color) {
        const primaryColor = nft.materialParams.color;
        console.log(`Found primary color in materialParams: ${primaryColor}`);
        return generateColorShades(primaryColor);
      }

      // Check for gradientColors in materialParams
      if (
        nft.materialParams.gradientColors &&
        Array.isArray(nft.materialParams.gradientColors)
      ) {
        console.log(
          `Found gradient colors in materialParams: ${nft.materialParams.gradientColors.join(
            ", "
          )}`
        );

        // Ensure we have 6 colors for all faces
        const gradientColors = [...nft.materialParams.gradientColors];
        while (gradientColors.length < 6) {
          // Add darker shades of the last color
          gradientColors.push(
            adjustColorBrightness(
              gradientColors[gradientColors.length - 1],
              -0.1 * gradientColors.length
            )
          );
        }
        return gradientColors;
      }
    }

    // Check in JSON metadata (common in stored NFTs)
    if (nft.json) {
      // First check for materialParams in json (this is our custom structure)
      if (nft.json.materialParams) {
        if (nft.json.materialParams.color) {
          return generateColorShades(nft.json.materialParams.color);
        }

        if (nft.json.materialParams.gradientColors) {
          const colors = [...nft.json.materialParams.gradientColors];
          while (colors.length < 6) {
            colors.push(
              adjustColorBrightness(
                colors[colors.length - 1],
                -0.1 * colors.length
              )
            );
          }
          return colors;
        }
      }

      // Check properties.colors which might be present in our minted NFTs
      if (nft.json.properties && nft.json.properties.colors) {
        return Array.isArray(nft.json.properties.colors)
          ? nft.json.properties.colors
          : generateColorShades(nft.json.properties.colors);
      }

      // Check for standard color attributes
      if (nft.json.attributes) {
        const colorAttr = nft.json.attributes.find(
          (attr: any) =>
            attr.trait_type?.toLowerCase() === "color" ||
            attr.trait_type?.toLowerCase() === "primary color"
        );

        if (colorAttr && colorAttr.value) {
          const colorValue = colorAttr.value.startsWith("#")
            ? colorAttr.value
            : colorNameToHex(colorAttr.value) || "#8b5cf6";
          return generateColorShades(colorValue);
        }
      }
    }

    // Check in nftData.metadata
    if (nft.metadata) {
      // Check for our materialParams in metadata
      if (nft.metadata.materialParams) {
        if (nft.metadata.materialParams.color) {
          return generateColorShades(nft.metadata.materialParams.color);
        }

        if (nft.metadata.materialParams.gradientColors) {
          return nft.metadata.materialParams.gradientColors;
        }
      }

      // Check properties
      if (nft.metadata.properties) {
        if (nft.metadata.properties.colors) {
          return Array.isArray(nft.metadata.properties.colors)
            ? nft.metadata.properties.colors
            : generateColorShades(nft.metadata.properties.colors);
        }
      }

      // Check attributes
      if (nft.metadata.attributes) {
        const colorAttr = nft.metadata.attributes.find(
          (attr: any) =>
            attr.trait_type?.toLowerCase() === "color" ||
            attr.trait_type?.toLowerCase() === "primary color"
        );

        if (colorAttr && colorAttr.value) {
          return generateColorShades(
            colorAttr.value.startsWith("#")
              ? colorAttr.value
              : colorNameToHex(colorAttr.value) || "#8b5cf6"
          );
        }
      }
    }

    // Check in nftData directly
    if (nft.nftData) {
      if (nft.nftData.materialParams) {
        if (nft.nftData.materialParams.color) {
          return generateColorShades(nft.nftData.materialParams.color);
        }

        if (nft.nftData.materialParams.gradientColors) {
          return nft.nftData.materialParams.gradientColors;
        }
      }
    }

    // Also check direct attributes on the NFT
    if (nft.attributes) {
      const colorAttr = nft.attributes.find(
        (attr: any) =>
          attr.trait_type?.toLowerCase() === "color" ||
          attr.trait_type?.toLowerCase() === "primary color"
      );

      if (colorAttr && colorAttr.value) {
        return generateColorShades(
          colorAttr.value.startsWith("#")
            ? colorAttr.value
            : colorNameToHex(colorAttr.value) || "#8b5cf6"
        );
      }
    }

    // Check for color property directly on NFT
    if (nft.color && typeof nft.color === "string") {
      return generateColorShades(nft.color);
    }

    // Check for name-based color as last resort
    if (nft.name) {
      const colorMatches = extractColorFromName(nft.name);
      if (colorMatches) {
        return generateColorShades(colorMatches);
      }
    }

    // If nothing found, return default colors but with a warning
    console.warn(
      `No color information found for NFT, using default purple: ${
        nft.name || nft.id
      }`
    );
    return defaultColors;
  } catch (error) {
    console.error(
      `Error extracting colors for NFT: ${nft.id || nft.name}`,
      error
    );
    return defaultColors;
  }
};

// Helper function to convert common color names to hex
function colorNameToHex(colorName: string): string | null {
  const colorMap: { [key: string]: string } = {
    red: "#ff0000",
    blue: "#0000ff",
    green: "#00ff00",
    yellow: "#ffff00",
    purple: "#8b5cf6",
    violet: "#8b5cf6",
    pink: "#ff00ff",
    orange: "#ffa500",
    gold: "#ffd700",
    silver: "#c0c0c0",
    black: "#000000",
    white: "#ffffff",
    ruby: "#e0115f",
    sapphire: "#0f52ba",
    emerald: "#50c878",
    cosmic: "#8b5cf6",
  };

  const lowerCaseName = colorName.toLowerCase();

  // First check for direct match
  if (colorMap[lowerCaseName]) {
    return colorMap[lowerCaseName];
  }

  // Then check for partial matches
  for (const [name, hex] of Object.entries(colorMap)) {
    if (lowerCaseName.includes(name)) {
      return hex;
    }
  }

  return null; // No match found
}

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
  console.log(`Processing model URL for NFT: ${nft.name || nft.id}`);

  try {
    // Direct extraction from NFT data with more exhaustive checks

    // 1. Check direct model3d URL
    if (nft.model3d) {
      console.log(`Found model3d URL: ${nft.model3d}`);
      return sanitizeModelUrl(nft.model3d);
    }

    // 2. Check for model3dHash and convert to URL
    if (nft.model3dHash) {
      console.log(`Found model3dHash: ${nft.model3dHash}`);
      const modelUrl = `https://ipfs.io/ipfs/${nft.model3dHash}`;
      console.log(`Generated model URL from hash: ${modelUrl}`);
      return modelUrl;
    }

    // 3. Check in materialParams (from AI generator)
    if (nft.materialParams && nft.materialParams.model3d) {
      console.log(
        `Found model in materialParams: ${nft.materialParams.model3d}`
      );
      return sanitizeModelUrl(nft.materialParams.model3d);
    }

    // 4. Check in json data
    if (nft.json) {
      // Check various possible locations in json
      if (nft.json.model3d) {
        console.log(`Found model3d in json: ${nft.json.model3d}`);
        return sanitizeModelUrl(nft.json.model3d);
      }

      if (nft.json.model3dHash) {
        const modelUrl = `https://ipfs.io/ipfs/${nft.json.model3dHash}`;
        console.log(`Generated model URL from json.model3dHash: ${modelUrl}`);
        return modelUrl;
      }

      if (nft.json.animation_url && isModelFile(nft.json.animation_url)) {
        console.log(
          `Found model in json.animation_url: ${nft.json.animation_url}`
        );
        return sanitizeModelUrl(nft.json.animation_url);
      }

      // Check for files array in properties
      if (nft.json.properties?.files) {
        const modelFile = nft.json.properties.files.find(
          (file: any) =>
            file.type === "model/gltf-binary" ||
            file.type === "model/gltf+json" ||
            file.type === "model/gltf" ||
            (file.uri && isModelFile(file.uri)) ||
            (file.url && isModelFile(file.url))
        );

        if (modelFile) {
          const modelUrl = modelFile.uri || modelFile.url;
          console.log(`Found model in json.properties.files: ${modelUrl}`);
          return sanitizeModelUrl(modelUrl);
        }
      }

      // Check for materialParams in json
      if (nft.json.materialParams && nft.json.materialParams.model3d) {
        console.log(
          `Found model in json.materialParams: ${nft.json.materialParams.model3d}`
        );
        return sanitizeModelUrl(nft.json.materialParams.model3d);
      }
    }

    // 5. Check in metadata
    if (nft.metadata) {
      if (
        nft.metadata.animation_url &&
        isModelFile(nft.metadata.animation_url)
      ) {
        console.log(
          `Found model in metadata.animation_url: ${nft.metadata.animation_url}`
        );
        return sanitizeModelUrl(nft.metadata.animation_url);
      }

      if (nft.metadata.model3d) {
        console.log(`Found model in metadata.model3d: ${nft.metadata.model3d}`);
        return sanitizeModelUrl(nft.metadata.model3d);
      }

      // Check for files array in properties
      if (nft.metadata.properties?.files) {
        const modelFile = nft.metadata.properties.files.find(
          (file: any) =>
            file.type === "model/gltf-binary" ||
            file.type === "model/gltf+json" ||
            file.type === "model/gltf" ||
            (file.uri && isModelFile(file.uri)) ||
            (file.url && isModelFile(file.url))
        );

        if (modelFile) {
          const modelUrl = modelFile.uri || modelFile.url;
          console.log(`Found model in metadata.properties.files: ${modelUrl}`);
          return sanitizeModelUrl(modelUrl);
        }
      }
    }

    // 6. Check for animation_url at top level
    if (nft.animation_url && isModelFile(nft.animation_url)) {
      console.log(
        `Found model in top-level animation_url: ${nft.animation_url}`
      );
      return sanitizeModelUrl(nft.animation_url);
    }

    // 7. Generate custom model if we have colors but no model
    if (nft.colors && Array.isArray(nft.colors) && nft.colors.length > 0) {
      // We could generate a model from colors using a service or URL template
      // For now, just use a fallback URL
      console.log(
        `No model URL found, but colors are available. Using default cube model.`
      );
      return "https://modelviewer.dev/shared-assets/models/Cube.glb";
    }

    console.log(`No model URL found for NFT: ${nft.name || nft.id}`);
    return null;
  } catch (error) {
    console.error(`Error processing model URL: ${error}`);
    return null;
  }
};

// Helper to check if a URL points to a 3D model file
function isModelFile(url: string): boolean {
  if (!url) return false;

  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.endsWith(".glb") ||
    lowerUrl.endsWith(".gltf") ||
    lowerUrl.includes("model") ||
    lowerUrl.includes("3d") ||
    lowerUrl.includes("cube") ||
    lowerUrl.includes("gltf")
  );
}

// Enhanced function to load the model and update cube
const loadAndApplyModel = async (
  cube: THREE.Mesh,
  modelUrl: string,
  colors: string[]
) => {
  try {
    console.log(`Loading 3D model from URL: ${modelUrl}`);

    // Validate the URL first
    if (
      !modelUrl.startsWith("http") &&
      !modelUrl.startsWith("data:") &&
      !modelUrl.startsWith("blob:")
    ) {
      throw new Error(`Invalid model URL: ${modelUrl}`);
    }

    // Create a loader instance
    const loader = new GLTFLoader();

    // Add error handling and timeouts
    const loadPromise = new Promise((resolve, reject) => {
      // Set a timeout to avoid hanging
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading model from ${modelUrl}`));
      }, 10000); // 10 second timeout

      loader.load(
        modelUrl,
        (gltf) => {
          clearTimeout(timeout);
          resolve(gltf);
        },
        (progress) => {
          console.log(
            `Loading model progress: ${Math.round(
              (progress.loaded / progress.total) * 100
            )}%`
          );
        },
        (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      );
    });

    const gltf = (await loadPromise) as any;
    console.log(`Successfully loaded model from: ${modelUrl}`);

    // Extract geometry from the loaded model
    let extractedGeometry: THREE.BufferGeometry | null = null;

    gltf.scene.traverse(
      (child: {
        name: any;
        geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes> | null;
        material: {
          length: any;
          forEach: (arg0: (mat: any, index: number) => void) => void;
          color: { getHexString: () => string };
        };
      }) => {
        if (child instanceof THREE.Mesh) {
          console.log(`Found mesh in loaded model: ${child.name}`);
          extractedGeometry = child.geometry;

          // Also try to extract materials/colors if available
          if (child.material) {
            if (Array.isArray(child.material)) {
              console.log(`Model has ${child.material.length} materials`);
              child.material.forEach((mat, index) => {
                if (mat.color) {
                  const hexColor = "#" + mat.color.getHexString();
                  console.log(`Material ${index} color: ${hexColor}`);
                  if (index < colors.length) {
                    colors[index] = hexColor;
                  }
                }
              });
            } else if (child.material.color) {
              const hexColor = "#" + child.material.color.getHexString();
              console.log(`Model material color: ${hexColor}`);
              colors[0] = hexColor;
            }
          }
        }
      }
    );

    // If we found geometry in the model, replace the cube's geometry
    if (extractedGeometry) {
      console.log(`Replacing cube geometry with model geometry`);
      cube.geometry.dispose(); // Clean up old geometry
      cube.geometry = (extractedGeometry as THREE.BufferGeometry).clone();
    } else {
      console.warn(`No usable geometry found in model, using default cube`);
    }

    // Apply the cube's colors
    if (cube.material instanceof THREE.MeshPhysicalMaterial) {
      cube.material.color.set(colors[0]);
      cube.material.needsUpdate = true;
    } else if (Array.isArray(cube.material)) {
      // If cube has multiple materials, update each one
      cube.material.forEach((mat, index) => {
        if (
          mat instanceof THREE.MeshPhysicalMaterial &&
          index < colors.length
        ) {
          mat.color.set(colors[index]);
          mat.needsUpdate = true;
        }
      });
    }

    console.log(`Successfully applied model and colors to cube`);
  } catch (error) {
    console.error(`Error loading model from ${modelUrl}:`, error);

    // Try fallback model in case of error
    try {
      console.log(`Attempting to load fallback model...`);
      const fallbackUrl =
        "https://modelviewer.dev/shared-assets/models/Cube.glb";
      const loader = new GLTFLoader();

      loader.load(
        fallbackUrl,
        (gltf) => {
          console.log(`Loaded fallback model`);
          // Apply fallback model if needed
          // Simpler application - just show the model

          // Apply colors to material
          if (cube.material instanceof THREE.MeshPhysicalMaterial) {
            cube.material.color.set(colors[0]);
            cube.material.needsUpdate = true;
          } else if (Array.isArray(cube.material)) {
            cube.material.forEach((mat, index) => {
              if (
                mat instanceof THREE.MeshPhysicalMaterial &&
                index < colors.length
              ) {
                mat.color.set(colors[index]);
                mat.needsUpdate = true;
              }
            });
          }
        },
        undefined,
        (fallbackError) => {
          console.error(`Even fallback model failed to load:`, fallbackError);
        }
      );
    } catch (fallbackError) {
      console.error(`Exception loading fallback model:`, fallbackError);
    }
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

      // Extract colors with improved function
      const colors = extractColorsFromNFT(nft);
      console.log(`Extracted colors: ${colors.join(", ")}`);

      // Get accent color from first color
      const accentColor = colors[0];

      // Extract model URL with improved function
      const model3d = await processModelUrl(nft);
      if (model3d) {
        console.log(`Found 3D model URL: ${model3d}`);
      }

      // Get or assign rarity based on available features
      let rarity = "common";
      if (nft.rarity) {
        rarity = nft.rarity.toLowerCase();
      } else if (model3d && colors[0] !== "#8b5cf6") {
        rarity = "epic"; // If has both model and custom color
      } else if (model3d || colors[0] !== "#8b5cf6") {
        rarity = "rare"; // If has either model or custom color
      }

      // Create border color based on accent color
      const borderColor = `rgba(${hexToRgb(accentColor)}, 0.5)`;

      // Create glow effect
      const glow = `0 0 25px rgba(${hexToRgb(accentColor)}, 0.7)`;

      // Create the cube object
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
        isNFT: true,
      };

      console.log(`Created RealmCube:`, {
        id: newCube.id,
        name: newCube.name,
        colors: newCube.colors.slice(0, 2), // Log just a couple colors to avoid cluttering the console
        model3d: model3d ? "Present" : "None",
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
const adjustColorBrightness = (hex: string, factor: number) => {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex values
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness
  r = Math.min(255, Math.max(0, Math.round(r + factor * 255)));
  g = Math.min(255, Math.max(0, Math.round(g + factor * 255)));
  b = Math.min(255, Math.max(0, Math.round(b + factor * 255)));

  // Convert back to hex
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

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
        // Create Three.js scene
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

        // Add renderer to the DOM
        modelRef.current.appendChild(renderer.domElement);

        // Position camera
        camera.position.z = 2;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Load the model
        const loader = new GLTFLoader();
        loader.load(
          model3d,
          (gltf) => {
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.5 / maxDim;

            gltf.scene.position.x = -center.x * scale;
            gltf.scene.position.y = -center.y * scale;
            gltf.scene.position.z = -center.z * scale;
            gltf.scene.scale.multiplyScalar(scale);

            // Add model to scene
            scene.add(gltf.scene);

            // Add glowing effect if hovered
            if (isHovered && glow) {
              gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.material.emissive = new THREE.Color(colors[0]);
                  child.material.emissiveIntensity = 0.5;
                }
              });
            }

            // Animation loop
            const animate = () => {
              requestAnimationFrame(animate);

              // Rotate the model based on props
              gltf.scene.rotation.x = THREE.MathUtils.degToRad(rotateX);
              gltf.scene.rotation.y = THREE.MathUtils.degToRad(rotateY);
              gltf.scene.rotation.z = THREE.MathUtils.degToRad(rotateZ);

              renderer.render(scene, camera);
            };

            animate();
          },
          undefined,
          (error) => {
            console.error("Error loading model:", error);
            // Fallback to standard cube if model fails to load
            modelRef.current?.classList.remove("model-loaded");
            modelRef.current?.classList.add("model-error");
          }
        );
      } catch (error) {
        console.error("Error initializing model viewer:", error);
      }

      return () => {
        // Cleanup Three.js resources on unmount
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
              // Process each NFT to extract metadata
              const processedNfts = await Promise.all(
                nfts.map(async (nft) => {
                  try {
                    // Try to fetch metadata if available
                    let metadata = null;

                    if (nft.uri) {
                      try {
                        console.log(`Fetching metadata from: ${nft.uri}`);
                        const response = await fetch(nft.uri);
                        if (response.ok) {
                          metadata = await response.json();
                          console.log(
                            `Got metadata for: ${
                              nft.name || nft.address.toString()
                            }`
                          );
                        } else {
                          console.warn(
                            `Failed to fetch metadata: ${response.status}`
                          );
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
                    const processedNft = {
                      id: nft.address.toString(),
                      name:
                        metadata?.name ||
                        nft.name ||
                        `NFT #${nft.address.toString().slice(0, 6)}`,
                      description: metadata?.description || "A unique NFT",
                      image: metadata?.image || nft.json?.image,
                      type: metadata?.properties?.type || "unknown",
                      materialParams:
                        metadata?.materialParams ||
                        nft.json?.materialParams ||
                        null,
                      attributes:
                        metadata?.attributes || nft.json?.attributes || [],
                      metadata: metadata || nft.json || {},
                      json: nft.json || metadata || {},
                      mintAddress: nft.address.toString(),
                      uri: nft.uri,
                    };

                    // Enhanced VOID cube detection
                    const isCube =
                      // Check explicit type in attributes
                      processedNft.attributes.some(
                        (attr: any) =>
                          (attr.trait_type === "Type" &&
                            attr.value === "Cube") ||
                          (attr.trait_type === "type" && attr.value === "Cube")
                      ) ||
                      // Check collection name
                      processedNft.metadata.collection?.name?.includes(
                        "VOID"
                      ) ||
                      // Check name
                      (processedNft.name?.includes("VOID") &&
                        processedNft.name?.includes("Cube")) ||
                      // Check for materialParams (our custom structure)
                      !!processedNft.materialParams ||
                      // Check for model3d
                      !!(
                        processedNft.metadata.model3d ||
                        processedNft.json.model3d
                      ) ||
                      // Check animation_url for glb
                      !!(
                        processedNft.metadata.animation_url?.includes(".glb") ||
                        processedNft.json.animation_url?.includes(".glb")
                      );

                    return { ...processedNft, isCube };
                  } catch (error) {
                    console.error(
                      `Error processing NFT ${nft.address.toString()}:`,
                      error
                    );
                    return null;
                  }
                })
              );

              // Filter out any failed processing and non-cube NFTs
              const allNfts = processedNfts.filter(
                (nft) => nft !== null
              ) as any[];
              const cubeNfts = allNfts.filter((nft) => nft.isCube);

              console.log(
                `Successfully processed ${allNfts.length} NFTs, found ${cubeNfts.length} cubes`
              );

              // Convert NFTs to cube format
              const nftCubes = await convertNFTsToCubes(cubeNfts);
              console.log(`Converted ${nftCubes.length} NFTs into RealmCubes`);

              if (nftCubes.length > 0) {
                // Combine default and NFT cubes, but make sure we don't add duplicates
                const existingIds = new Set(
                  cubeCollection.map((cube) => cube.id)
                );
                const uniqueNftCubes = nftCubes.filter(
                  (cube) => !existingIds.has(cube.id)
                );

                setCombinedCubeCollection([
                  ...cubeCollection,
                  ...uniqueNftCubes,
                ]);
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
        {/* Change from default "wait" to "sync" */}
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
