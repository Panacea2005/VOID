// lib/utils/nftTypeDetector.ts
// Utility functions to detect NFT types (audio, cube, etc.)

/**
 * Detects if an NFT represents audio/music content
 * @param nft NFT metadata object
 * @returns boolean indicating if this is an audio NFT
 */
export function isAudioNFT(nft: any): boolean {
    if (!nft) return false;
    
    try {
      // Check direct type property
      if (nft.type === "music" || nft.type === "audio") {
        return true;
      }
      
      // Check in JSON metadata
      if (nft.json?.type === "music" || nft.json?.type === "audio") {
        return true;
      }
      
      // Check name for audio-related keywords
      if (nft.name && typeof nft.name === "string") {
        const lowerName = nft.name.toLowerCase();
        if (
          lowerName.includes("music") ||
          lowerName.includes("audio") ||
          lowerName.includes("sound") ||
          lowerName.includes("track") ||
          lowerName.includes("song")
        ) {
          return true;
        }
      }
      
      // Check for audio extensions in animation_url
      if (nft.animation_url && typeof nft.animation_url === "string") {
        const url = nft.animation_url.toLowerCase();
        if (
          url.endsWith(".mp3") ||
          url.endsWith(".wav") ||
          url.endsWith(".ogg") ||
          url.endsWith(".flac") ||
          url.endsWith(".m4a")
        ) {
          return true;
        }
      }
      
      // Check properties.files for audio content
      if (nft.properties?.files?.length) {
        const hasAudioFile = nft.properties.files.some((file: any) => {
          if (!file) return false;
          
          const fileType = typeof file.type === "string" ? file.type.toLowerCase() : "";
          const fileUri = typeof file.uri === "string" ? file.uri.toLowerCase() : "";
          
          return (
            fileType.includes("audio") ||
            fileUri.endsWith(".mp3") ||
            fileUri.endsWith(".wav") ||
            fileUri.endsWith(".ogg") ||
            fileUri.endsWith(".flac")
          );
        });
        
        if (hasAudioFile) return true;
      }
      
      // Check attributes for audio-related traits
      if (Array.isArray(nft.attributes)) {
        const hasAudioAttr = nft.attributes.some((attr: any) => {
          if (!attr || !attr.trait_type) return false;
          
          const traitType = attr.trait_type.toLowerCase();
          return (
            traitType === "audio" || 
            traitType === "music" ||
            traitType === "audio url" ||
            traitType === "music url" ||
            traitType === "sound" ||
            traitType === "track"
          );
        });
        
        if (hasAudioAttr) return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error in isAudioNFT:", error);
      return false;
    }
  }
  
  /**
   * Detects if an NFT represents a 3D cube
   * @param nft NFT metadata object
   * @returns boolean indicating if this is a cube NFT
   */
  export function isCubeNFT(nft: any): boolean {
    if (!nft) return false;
    
    try {
      // Check direct type property
      if (nft.type === "cube" || nft.type === "3d" || nft.type === "model") {
        return true;
      }
      
      // Check in JSON metadata
      if (nft.json?.type === "cube" || nft.json?.type === "3d" || nft.json?.type === "model") {
        return true;
      }
      
      // Check name for cube-related keywords
      if (nft.name && typeof nft.name === "string") {
        const lowerName = nft.name.toLowerCase();
        if (
          lowerName.includes("cube") ||
          lowerName.includes("void cube") ||
          lowerName.includes("3d") ||
          lowerName.includes("model")
        ) {
          return true;
        }
      }
      
      // Check for 3D model extensions in animation_url
      if (nft.animation_url && typeof nft.animation_url === "string") {
        const url = nft.animation_url.toLowerCase();
        if (
          url.endsWith(".glb") ||
          url.endsWith(".gltf") ||
          url.endsWith(".obj") ||
          url.endsWith(".fbx") ||
          url.includes("modelviewer")
        ) {
          return true;
        }
      }
      
      // Check for model URLs or hashes
      if (nft.model3d || nft.model3dHash) {
        return true;
      }
      
      // Check properties.files for 3D model content
      if (nft.properties?.files?.length) {
        const has3DFile = nft.properties.files.some((file: any) => {
          if (!file) return false;
          
          const fileType = typeof file.type === "string" ? file.type.toLowerCase() : "";
          const fileUri = typeof file.uri === "string" ? file.uri.toLowerCase() : "";
          
          return (
            fileType.includes("model") ||
            fileType.includes("gltf") ||
            fileType.includes("glb") ||
            fileUri.endsWith(".glb") ||
            fileUri.endsWith(".gltf") ||
            fileUri.endsWith(".obj") ||
            fileUri.endsWith(".fbx")
          );
        });
        
        if (has3DFile) return true;
      }
      
      // Check for materialParams which indicates a cube
      if (nft.materialParams || nft.json?.materialParams) {
        return true;
      }
      
      // Check attributes for cube-related traits
      if (Array.isArray(nft.attributes)) {
        const hasCubeAttr = nft.attributes.some((attr: any) => {
          if (!attr || !attr.trait_type || !attr.value) return false;
          
          const traitType = attr.trait_type.toLowerCase();
          const value = typeof attr.value === "string" ? attr.value.toLowerCase() : "";
          
          return (
            (traitType === "type" && (value === "cube" || value === "3d" || value === "model")) ||
            traitType === "model" ||
            traitType === "3d" ||
            traitType === "model url" ||
            traitType === "shape"
          );
        });
        
        if (hasCubeAttr) return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error in isCubeNFT:", error);
      return false;
    }
  }
  
  /**
   * Categorizes an NFT by detecting its most likely type
   * @param nft NFT metadata object
   * @returns detected NFT type as a string
   */
  export function detectNFTType(nft: any): string {
    if (isAudioNFT(nft)) return "audio";
    if (isCubeNFT(nft)) return "cube";
    
    // Default type
    return "image";
  }