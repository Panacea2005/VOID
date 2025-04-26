import { Connection, PublicKey } from "@solana/web3.js";
import {
  uploadToPinata,
  getIpfsUrl,
  getDirectModelUrl,
  getModelViewerUrl,
} from "./pinataService";
import { mintNFT, NFTMetadata } from "./nftService";

// VOID ART Collection name
const VOID_ART_COLLECTION = "VOID Art Collection";

/**
 * Convert pixel art canvas to a high-quality PNG file
 * @param canvasElement The HTML canvas element with pixel art
 * @param name Name for the file
 * @returns File object with the PNG data
 */
export async function convertPixelArtToFile(canvasElement: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      // Ensure canvas has content
      if (canvasElement.width === 0 || canvasElement.height === 0) {
        console.warn("Canvas has zero dimensions, using default size");
        canvasElement.width = 512;
        canvasElement.height = 512;
      }
      
      // Convert to high-quality PNG
      canvasElement.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert pixel art canvas to blob'));
          return;
        }

        // Create a meaningful filename
        const sanitizedName = name.replace(/\s+/g, '-').toLowerCase();
        const fileName = `void-art-${sanitizedName}-${Date.now()}.png`;
        
        // Create file with proper MIME type
        const file = new File([blob], fileName, {
          type: 'image/png'
        });

        console.log(`Created pixel art image file: ${file.name}, size: ${file.size} bytes`);
        resolve(file);
      }, 'image/png', 1.0); // Use highest quality
    } catch (error) {
      console.error("Error converting pixel art to file:", error);
      reject(error);
    }
  });
}

/**
 * Prepares metadata for a Pixel Art NFT
 * @param name NFT name
 * @param description NFT description
 * @param imageFile The pixel art PNG file
 * @param attributes Additional attributes for the NFT
 * @param pixelArtParams Optional parameters specific to pixel art (resolution, etc.)
 * @returns Complete NFT metadata
 */
export async function getPixelArtNFTMetadata(
  name: string,
  description: string,
  imageFile: File,
  attributes: any[],
  pixelArtParams?: {
    canvasSize?: number;
    prompt?: string;
    style?: string;
    [key: string]: any;
  }
): Promise<any> {
  console.log("Creating Pixel Art NFT metadata", {
    name,
    description,
    imageType: imageFile.type,
    imageSize: imageFile.size,
    attributes: attributes.length,
    params: !!pixelArtParams
  });

  // Add Collection attribute if not present
  const hasCollectionAttribute = attributes.some(
    (attr) => attr.trait_type === "Collection"
  );
  
  const completeAttributes = hasCollectionAttribute
    ? attributes
    : [
        ...attributes,
        {
          trait_type: "Collection",
          value: VOID_ART_COLLECTION,
        },
      ];

  // Add Type attribute if not present
  const hasTypeAttribute = completeAttributes.some(
    (attr) => attr.trait_type === "Type"
  );

  if (!hasTypeAttribute) {
    completeAttributes.push({
      trait_type: "Type",
      value: "Pixel Art",
    });
  }

  // Add pixel art specific attributes
  if (pixelArtParams) {
    // Resolution
    if (pixelArtParams.canvasSize) {
      completeAttributes.push({
        trait_type: "Resolution",
        value: `${pixelArtParams.canvasSize}x${pixelArtParams.canvasSize}`,
      });
    }

    // If prompt was provided, add it as attribute
    if (pixelArtParams.prompt) {
      completeAttributes.push({
        trait_type: "Prompt",
        value: pixelArtParams.prompt.length > 100 
          ? pixelArtParams.prompt.substring(0, 97) + "..." 
          : pixelArtParams.prompt
      });
    }

    // Add style if provided
    if (pixelArtParams.style) {
      completeAttributes.push({
        trait_type: "Style",
        value: pixelArtParams.style
      });
    }
  }

  // Files array for properties
  const files = [
    {
      uri: "placeholder", // Will be replaced with actual URI after upload
      type: imageFile.type || "image/png",
    }
  ];

  // Build full properties object
  const fullProperties = {
    files,
    category: "image",
    collection: {
      name: VOID_ART_COLLECTION,
      family: "VOID Art",
    },
    // Store pixel art parameters
    pixelArtParams: pixelArtParams || {},
    // Add any additional properties
    createdOn: new Date().toISOString(),
  };

  // Return complete metadata with all necessary parameters
  return {
    name,
    symbol: "VART",
    description,
    image: imageFile,
    attributes: completeAttributes,
    properties: fullProperties,
  };
}

/**
 * Mints a Pixel Art NFT to the blockchain
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param pixelArtData Object containing pixel art metadata
 * @param imageFile The pixel art image file
 * @returns Minted NFT address
 */
export async function mintPixelArtNFT(
  connection: Connection,
  wallet: any,
  pixelArtData: {
    name: string,
    description: string,
    attributes: Array<{ trait_type: string, value: string }>,
    pixelArtParams?: any
  },
  imageFile: File
): Promise<string> {
  try {
    console.log('Starting Pixel Art NFT minting process...');
    console.log('Pixel Art params provided:', JSON.stringify(pixelArtData.pixelArtParams, null, 2));

    // Create metadata for the Pixel Art NFT
    const metadata = await getPixelArtNFTMetadata(
      pixelArtData.name,
      pixelArtData.description,
      imageFile,
      pixelArtData.attributes,
      pixelArtData.pixelArtParams
    );

    // Upload image to IPFS with pixel art parameters
    console.log('Uploading pixel art image to IPFS...');
    const imageIpfsHash = await uploadToPinata(imageFile, {
      name: pixelArtData.name + " Image",
      description: "Pixel Art for " + pixelArtData.name,
      type: imageFile.type || 'image/png',
      // Embed pixel art parameters with the image for more complete metadata
      pixelArtParams: JSON.stringify(pixelArtData.pixelArtParams || {})
    });
    
    const imageUri = `ipfs://${imageIpfsHash}`;
    const imageUrl = getIpfsUrl(imageIpfsHash);
    const fallbackImages = [
      `https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`,
      `https://cloudflare-ipfs.com/ipfs/${imageIpfsHash}`,
      `https://ipfs.filebase.io/ipfs/${imageIpfsHash}`
    ];

    console.log("Pixel art image uploaded to IPFS:", imageUrl);

    // Ensure Collection attribute is added
    const hasCollection = pixelArtData.attributes.some(attr => attr.trait_type === 'Collection');
    if (!hasCollection) {
      pixelArtData.attributes.push({
        trait_type: 'Collection',
        value: VOID_ART_COLLECTION
      });
    }

    // Prepare complete metadata
    const nftMetadata: any = {
      name: pixelArtData.name,
      symbol: "VART",
      description: pixelArtData.description,
      image: imageUri,
      attributes: pixelArtData.attributes,
      collection: {
        name: VOID_ART_COLLECTION,
        family: "VOID Art"
      },
      // Store all properties in properties object
      properties: {
        files: [
          {
            uri: imageUri,
            type: imageFile.type || 'image/png',
            cdn: imageUrl
          }
        ],
        category: "image",
        // Store pixel art parameters
        pixelArtParams: pixelArtData.pixelArtParams || {},
        // Add collection information
        collection: {
          name: VOID_ART_COLLECTION,
          family: "VOID Art"
        }
      }
    };

    // Prepare metadata JSON file
    const metadataJson = JSON.stringify(nftMetadata, null, 2);
    const metadataBlob = new Blob([metadataJson], { type: 'application/json' });
    const metadataFile = new File([metadataBlob], `${pixelArtData.name.replace(/\s+/g, '-')}-metadata.json`, {
      type: 'application/json'
    });

    // Upload metadata to IPFS
    console.log('Uploading complete metadata to IPFS...');
    const metadataIpfsHash = await uploadToPinata(metadataFile, {
      name: `${pixelArtData.name}-metadata`,
      description: `Metadata for ${pixelArtData.name}`,
      type: 'application/json',
      // Include pixel art parameters for redundancy
      pixelArtParams: JSON.stringify(pixelArtData.pixelArtParams || {})
    });
    
    const metadataUri = `ipfs://${metadataIpfsHash}`;
    console.log('Metadata uploaded to IPFS:', metadataUri);

    // Check if wallet is connected
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      // Mint the NFT using the shared nftService
      console.log("Minting Pixel Art NFT with complete metadata...");
      const solanaMetadata = {
        name: nftMetadata.name,
        symbol: nftMetadata.symbol,
        description: nftMetadata.description,
        image: imageFile, // Pass original file rather than URI
        attributes: nftMetadata.attributes,
        properties: nftMetadata.properties,
        // Add URI to the complete metadata
        uri: metadataUri
      };

      // Call actual NFT minting function with complete metadata
      const mintedNftAddress = await mintNFT(connection, wallet, solanaMetadata);
      console.log('Successfully minted Pixel Art NFT with address:', mintedNftAddress);

      // Get latest transaction information (similar to other NFT types)
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

      // Save complete information to localStorage for immediate UI display
      const nftData = {
        id: mintedNftAddress,
        name: pixelArtData.name,
        description: pixelArtData.description,
        image: imageUrl,
        fallbackImages,
        ipfsUrl: imageUrl,
        ipfsHash: imageIpfsHash,
        properties: nftMetadata.properties,
        attributes: pixelArtData.attributes,
        mintedAt: new Date().toISOString(),
        solanaAddress: mintedNftAddress,
        mintAddress: mintedNftAddress,
        txSignature: txSignature,
        type: "pixel-art", // Unique type for pixel art
        price: 1.0 + Math.random() * 2,
        owner: wallet.publicKey.toString(),
        collection: {
          name: VOID_ART_COLLECTION,
          family: "VOID Art"
        },
        symbol: "VART",
        // Store pixel art parameters
        pixelArtParams: pixelArtData.pixelArtParams || {},
        // Store URI to complete metadata
        metadataUri: metadataUri,
        metadataIpfsHash: metadataIpfsHash
      };

      // Save to localStorage
      try {
        const userNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
        userNfts.push(nftData);
        localStorage.setItem('userNfts', JSON.stringify(userNfts));
        console.log('Saved complete Pixel Art NFT data to localStorage');
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }

      // Return the minted NFT address
      return mintedNftAddress;
    } catch (mintingError) {
      console.error("Error during minting:", mintingError);
      // Try local storage as fallback if minting fails
      saveLocalPixelArtNFT(pixelArtData.name, pixelArtData.description, imageFile, pixelArtData.attributes, pixelArtData.pixelArtParams, imageUrl, imageIpfsHash);
      throw mintingError;
    }
  } catch (error) {
    console.error('Error minting Pixel Art NFT:', error);
    throw error;
  }
}

/**
 * Save Pixel Art NFT locally when minting fails
 */
export function saveLocalPixelArtNFT(
  name: string,
  description: string,
  imageFile: File,
  attributes: any[],
  pixelArtParams: any,
  imageUrl?: string,
  imageIpfsHash?: string
): string {
  try {
    console.log("Saving Pixel Art NFT locally");
    
    // Generate a local ID
    const localId = `local-pixel-art-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    
    // Create a FileReader to convert the image to data URL
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    
    reader.onload = () => {
      // Create local NFT object
      const localNft = {
        id: localId,
        name: name,
        description: description,
        image: imageUrl || reader.result,
        ipfsHash: imageIpfsHash,
        ipfsUrl: imageUrl,
        properties: {
          pixelArtParams: pixelArtParams,
          files: [{
            uri: imageUrl || "local://image",
            type: imageFile.type || "image/png"
          }],
          category: "image",
          collection: {
            name: VOID_ART_COLLECTION,
            family: "VOID Art"
          }
        },
        attributes: attributes,
        mintedAt: new Date().toISOString(),
        type: "pixel-art",
        price: 0.5 + Math.random() * 1.5,
        collection: {
          name: VOID_ART_COLLECTION,
          family: "VOID Art"
        },
        symbol: "VART",
        local: true, // Mark as locally stored
        pixelArtParams: pixelArtParams
      };
      
      // Save to localStorage
      const userNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
      userNfts.push(localNft);
      localStorage.setItem('userNfts', JSON.stringify(userNfts));
      
      console.log("Pixel Art NFT saved locally:", localId);
    };
    
    return localId;
  } catch (error) {
    console.error("Error saving Pixel Art NFT locally:", error);
    return "error-local-save";
  }
}

/**
 * Handles minting a Pixel Art NFT with fallback to local storage
 */
export async function handlePixelArtMint(
  canvasElement: HTMLCanvasElement,
  connection: Connection,
  wallet: any,
  pixelArtData: {
    name: string,
    description: string,
    prompt?: string,
    canvasSize?: number,
    attributes?: Array<{ trait_type: string, value: string }>
  }
): Promise<{success: boolean, nftAddress?: string, error?: string}> {
  try {
    // Prepare attributes array
    const attributes = pixelArtData.attributes || [];
    
    // Ensure we have a Type attribute
    if (!attributes.some(attr => attr.trait_type === "Type")) {
      attributes.push({
        trait_type: "Type",
        value: "Pixel Art"
      });
    }
    
    // Add pixel art specific attributes if missing
    if (pixelArtData.canvasSize && !attributes.some(attr => attr.trait_type === "Resolution")) {
      attributes.push({
        trait_type: "Resolution",
        value: `${pixelArtData.canvasSize}x${pixelArtData.canvasSize}`
      });
    }
    
    if (pixelArtData.prompt && !attributes.some(attr => attr.trait_type === "Prompt")) {
      attributes.push({
        trait_type: "Prompt",
        value: pixelArtData.prompt.length > 100 
          ? pixelArtData.prompt.substring(0, 97) + "..." 
          : pixelArtData.prompt
      });
    }
    
    // Convert canvas to file
    console.log("Converting pixel art canvas to file...");
    const imageFile = await convertPixelArtToFile(canvasElement, pixelArtData.name);
    
    // Check wallet connection
    if (!wallet || !wallet.publicKey) {
      console.warn("Wallet not connected, saving locally instead");
      
      const localId = saveLocalPixelArtNFT(
        pixelArtData.name,
        pixelArtData.description,
        imageFile,
        attributes,
        {
          prompt: pixelArtData.prompt,
          canvasSize: pixelArtData.canvasSize
        }
      );
      
      return {
        success: true,
        nftAddress: localId,
        error: "Wallet not connected, saved locally"
      };
    }
    
    // Attempt to mint on blockchain
    console.log("Attempting to mint Pixel Art NFT on blockchain...");
    const mintedAddress = await mintPixelArtNFT(
      connection,
      wallet,
      {
        name: pixelArtData.name,
        description: pixelArtData.description,
        attributes: attributes,
        pixelArtParams: {
          prompt: pixelArtData.prompt,
          canvasSize: pixelArtData.canvasSize,
          createdAt: new Date().toISOString()
        }
      },
      imageFile
    );
    
    return {
      success: true,
      nftAddress: mintedAddress
    };
  } catch (error: any) {
    console.error("Error in handlePixelArtMint:", error);
    
    // If minting fails but we've already saved locally, just return that error message
    if (error.message && error.message.includes("saved locally")) {
      return {
        success: false,
        error: error.message
      };
    }
    
    // Otherwise create generic error message
    return {
      success: false,
      error: `Failed to mint Pixel Art NFT: ${error.message || "Unknown error"}`
    };
  }
}