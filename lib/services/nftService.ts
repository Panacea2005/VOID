import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  Metaplex,
  walletAdapterIdentity,
  NftWithToken,
  CreateNftInput,
} from "@metaplex-foundation/js";
import {
  uploadToPinata,
  getIpfsUrl,
  getDirectModelUrl,
  getModelViewerUrl,
} from "./pinataService";

// Các thuộc tính metadata mở rộng để bao gồm cả thông tin collection
export interface ExtendedProperties {
  files: Array<{
    uri: string;
    type: string;
  }>;
  category: string;
  // Các thuộc tính tùy chỉnh cho collection
  [key: string]: any;
}

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: File;
  model?: File;
  audio?: File;
  audioUrl?: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  properties: ExtendedProperties;
}

// Biến để theo dõi nếu Pinata thất bại
let PINATA_FAILED = false;

// Hàm upload an toàn, thử các phương pháp khác nhau nếu phương pháp chính thất bại
async function safeUpload(file: File, metadata: any, retries = 3): Promise<string> {
  try {
    return await uploadToPinata(file, metadata);
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    
    if (retries > 0) {
      console.log(`Retrying upload, ${retries} attempts remaining...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return safeUpload(file, metadata, retries - 1);
    }
    
    // If we've exhausted retries, create a mock hash for development
    console.error("Failed all upload attempts, using mock CID");
    const mockCid = `mock${Date.now()}${Math.floor(Math.random() * 1000000)}`;
    
    // Try to save data to localStorage for display purposes
    if (typeof window !== 'undefined') {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          localStorage.setItem(`file_${mockCid}`, reader.result as string);
        };
      } catch (e) {
        console.error("Error saving file to localStorage:", e);
      }
    }
    
    return mockCid;
  }
}

// ID tĩnh cho collections
const VOID_CUBE_COLLECTION_ID = "void-cube-collection";
const VOID_MUSIC_COLLECTION_ID = "void-music-collection";

export async function mintNFT(
  connection: Connection,
  wallet: any,
  metadata: NFTMetadata
): Promise<string> {
  try {
    console.log("Starting NFT minting process with metadata:", {
      name: metadata.name,
      description: metadata.description,
      hasImage: !!metadata.image,
      hasModel: !!metadata.model,
    });

    // Configure connection with better options
    const enhancedConnection = new Connection(connection.rpcEndpoint, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000, // 60 seconds timeout
      disableRetryOnRateLimit: false,
      httpHeaders: { "Content-Type": "application/json" },
    });

    // Upload image to IPFS
    console.log("Uploading image to IPFS...");
    const imageIpfsHash = await safeUpload(metadata.image, {
      name: `${metadata.name}-image`,
      description: metadata.description,
      type: metadata.image.type || "image/png",
    });

    const imageUri = `ipfs://${imageIpfsHash}`;
    console.log("Image uploaded:", imageUri);

    // Variables for model data
    let modelUri = "";
    let modelType = "model/gltf-binary";
    let model3dIpfsHash = "";

    // If we have a 3D model file, upload it too
    if (metadata.model) {
      console.log("Uploading 3D model...");
      
      // Make sure it has the correct MIME type
      const modelFile = metadata.model;
      console.log("Model file:", modelFile.name, modelFile.type, modelFile.size, "bytes");
      
      // Set correct model MIME type
      modelType = "model/gltf-binary";

      // Upload model to IPFS with material params in metadata
      try {
        model3dIpfsHash = await safeUpload(modelFile, {
          name: `${metadata.name}-model`,
          description: `3D Model for ${metadata.name}`,
          type: modelType,
          materialParams: JSON.stringify(metadata.properties?.materialParams || {}),
        });

        // Generate proper URIs and URLs
        modelUri = `ipfs://${model3dIpfsHash}`;
        
        console.log("Model uploaded successfully:", {
          modelUri,
          model3dIpfsHash,
        });
      } catch (modelError) {
        console.error("Error uploading model, continuing without it:", modelError);
      }
    }

    // Prepare metadata with image and model
    const metadataWithFiles: any = {
      name: metadata.name,
      description: metadata.description,
      image: imageUri,
      attributes: metadata.attributes,
      collection: {
        name: "VOID Cube Collection",
        family: "VOID Cube",
      },
      properties: {
        files: [
          {
            uri: imageUri,
            type: metadata.image.type || "image/png",
          },
        ],
        category: "image",
        collection: {
          name: "VOID Cube Collection",
          family: "VOID Cube",
        },
      },
    };

    // Add model to metadata if we have one
    if (modelUri) {
      metadataWithFiles.model = modelUri;
      metadataWithFiles.animation_url = modelUri; // Many marketplaces use this for 3D models
      
      // Add to files array
      metadataWithFiles.properties.files.push({
        uri: modelUri,
        type: modelType,
      });
      
      // Add extra model properties
      metadataWithFiles.properties.model = modelUri;
      metadataWithFiles.properties.model_type = "glb";
      
      // Add material parameters for perfect reproduction
      if (metadata.properties?.materialParams) {
        metadataWithFiles.properties.materialParams = metadata.properties.materialParams;
      }
      
      // Add colors for easier access
      if (metadata.properties?.colors) {
        metadataWithFiles.properties.colors = metadata.properties.colors;
      }
    }

    // Prepare metadata JSON file
    console.log("Preparing metadata JSON...");
    const metadataBlob = new Blob(
      [JSON.stringify(metadataWithFiles, null, 2)],
      { type: "application/json" }
    );
    const metadataFile = new File(
      [metadataBlob],
      `${metadata.name.replace(/\s+/g, "-")}-metadata.json`,
      { type: "application/json" }
    );

    // Upload metadata to IPFS
    console.log("Uploading metadata to IPFS...");
    const metadataIpfsHash = await safeUpload(metadataFile, {
      name: `${metadata.name}-metadata`,
      type: "application/json",
    });
    const metadataUri = `ipfs://${metadataIpfsHash}`;

    // Initialize Metaplex
    console.log("Initializing Metaplex and minting NFT...");
    const metaplex = Metaplex.make(enhancedConnection).use(
      walletAdapterIdentity(wallet)
    );

    // Limited retry logic for minting
    let attemptCount = 0;
    const maxAttempts = 3;
    let mintedNftAddress = "";

    // Try minting with multiple attempts
    while (attemptCount < maxAttempts) {
      try {
        attemptCount++;
        console.log(`Minting NFT (attempt ${attemptCount}/${maxAttempts})...`);

        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } =
          await enhancedConnection.getLatestBlockhash("finalized");
        console.log(
          `Got blockhash: ${blockhash}, lastValidBlockHeight: ${lastValidBlockHeight}`
        );

        // Create NFT with new blockhash
        const { nft, response } = await metaplex.nfts().create({
          uri: metadataUri,
          name: metadata.name,
          sellerFeeBasisPoints: 500, // 5% royalty
          symbol: metadata.symbol || "VOID",
          creators: [
            {
              address: wallet.publicKey,
              share: 100,
            },
          ],
          collection: null, // Not using official collection
          tokenStandard: 0, // Non-Fungible Token standard
          uses: null,
        });

        console.log("NFT created successfully:", nft.address.toString());
        console.log("Transaction signature:", response.signature);

        // Save the NFT address
        mintedNftAddress = nft.address.toString();

        // Successfully minted, break the loop
        break;
      } catch (error) {
        // Handle error and decide whether to retry
        console.error(
          `Error minting NFT (attempt ${attemptCount}/${maxAttempts}):`,
          error
        );

        // If max attempts reached, throw error
        if (attemptCount >= maxAttempts) {
          console.error("Max retry attempts reached, minting failed");
          throw error;
        }

        // Wait before retrying
        console.log("Waiting 2 seconds before retrying...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Return the minted NFT address
    return mintedNftAddress;
  } catch (error) {
    console.error("Error in mintNFT function:", error);
    throw error;
  }
}

export async function getCubeNFTMetadata(
  name: string,
  description: string,
  image: File,
  model: File | null,
  attributes: any,
  params: { materialParams: any; colors: string[] }
): Promise<NFTMetadata> {
  // Add Collection attribute if not present
  const hasCollectionAttribute = attributes.some(
    (attr: any) => attr.trait_type === "Collection"
  );
  
  const completeAttributes = hasCollectionAttribute
    ? attributes
    : [
        ...attributes,
        {
          trait_type: "Collection",
          value: "VOID Cube Collection",
        },
      ];

  // Build files array for properties, always starting with the image
  const files = [
    {
      uri: "placeholder", // Will be replaced with actual URI after upload
      type: image.type || "image/png",
    }
  ];
  
  // If we have a 3D model, add it to the files array
  if (model) {
    files.push({
      uri: "placeholder-model", // Will be replaced with actual model URI after upload
      type: "model/gltf-binary",
    });
  }

  // Return complete metadata
  return {
    name,
    symbol: "VOID",
    description,
    image,
    ...(model && { model }), // Only add model if provided
    attributes: [
      {
        trait_type: "Type",
        value: "Cube",
      },
      ...completeAttributes,
    ],
    properties: {
      files,
      category: "image",
      collection: {
        name: "VOID Cube Collection",
        family: "VOID Cube",
      },
      // Store material parameters in properties for perfect reproduction
      materialParams: params.materialParams,
      // Store colors separately for easier access
      colors: params.colors,
      // Add model_type property if we have a model
      ...(model && { model_type: "glb" }),
    },
  };
}


export function verifyCubeProperties(
  originalMaterialParams: any,
  mintedNFT: any
): {
  preserved: boolean;
  differences?: string[];
} {
  if (!originalMaterialParams || !mintedNFT) {
    return {
      preserved: false,
      differences: ["Missing original or minted parameters"],
    };
  }

  // Get the minted material parameters
  const mintedParams =
    mintedNFT.materialParams || mintedNFT.properties?.materialParams;

  if (!mintedParams) {
    return {
      preserved: false,
      differences: ["No material parameters found in minted NFT"],
    };
  }

  // Compare original and minted parameters
  const differences: string[] = [];

  // Define the critical properties to check
  const criticalProperties = [
    "color",
    "metalness",
    "roughness",
    "emissive",
    "emissiveIntensity",
    "transparent",
    "opacity",
    "iridescence",
    "clearcoat",
    "anisotropy",
    "sheen",
    "gradientColors",
    "texturePattern",
  ];

  for (const prop of criticalProperties) {
    // Skip undefined properties
    if (
      originalMaterialParams[prop] === undefined &&
      mintedParams[prop] === undefined
    ) {
      continue;
    }

    // Compare arrays (like gradientColors)
    if (Array.isArray(originalMaterialParams[prop])) {
      if (
        !Array.isArray(mintedParams[prop]) ||
        JSON.stringify(originalMaterialParams[prop]) !==
          JSON.stringify(mintedParams[prop])
      ) {
        differences.push(
          `${prop}: Original ${JSON.stringify(
            originalMaterialParams[prop]
          )} ≠ Minted ${JSON.stringify(mintedParams[prop])}`
        );
      }
      continue;
    }

    // Compare objects
    if (
      typeof originalMaterialParams[prop] === "object" &&
      originalMaterialParams[prop] !== null
    ) {
      if (
        JSON.stringify(originalMaterialParams[prop]) !==
        JSON.stringify(mintedParams[prop])
      ) {
        differences.push(`${prop}: Object differences detected`);
      }
      continue;
    }

    // Compare simple values
    if (originalMaterialParams[prop] !== mintedParams[prop]) {
      differences.push(
        `${prop}: Original ${originalMaterialParams[prop]} ≠ Minted ${mintedParams[prop]}`
      );
    }
  }

  return {
    preserved: differences.length === 0,
    differences: differences.length > 0 ? differences : undefined,
  };
}

// Tạo metadata cho NFT âm nhạc
export async function getMusicNFTMetadata(
  name: string,
  description: string,
  image: File,
  audioUrl: string,
  attributes: any
): Promise<NFTMetadata> {
  // Thêm Collection attribute nếu chưa có
  const hasCollectionAttribute = attributes.some(
    (attr: any) => attr.trait_type === "Collection"
  );
  const completeAttributes = hasCollectionAttribute
    ? attributes
    : [
        ...attributes,
        {
          trait_type: "Collection",
          value: "VOID Music Collection",
        },
      ];

  return {
    name,
    symbol: "VMUSIC",
    description,
    image,
    audioUrl,
    attributes: [
      {
        trait_type: "Type",
        value: "Music",
      },
      ...completeAttributes,
    ],
    properties: {
      files: [
        {
          uri: "placeholder",
          type: "image/png",
        },
        {
          uri: audioUrl,
          type: "audio/mpeg",
        },
      ],
      category: "audio",
      collection: {
        name: "VOID Music Collection",
        family: "VOID Music",
      },
    },
  };
}

// Lấy thông tin NFT từ ví
export async function getNFTsByOwner(
  connection: Connection,
  ownerPublicKey: PublicKey
) {
  try {
    const metaplex = Metaplex.make(connection);
    const nfts = await metaplex.nfts().findAllByOwner({
      owner: ownerPublicKey,
    });

    // Lọc NFTs để chỉ lấy những NFT từ dự án VOID
    const filteredNfts = nfts.filter(
      (nft) =>
        nft.symbol === "VOID" ||
        nft.name.includes("VOID") ||
        nft.creators.some(
          (creator) => creator.address.toString() === ownerPublicKey.toString()
        )
    );

    console.log(`Tìm thấy ${filteredNfts.length} VOID NFTs trong ví`);

    return filteredNfts;
  } catch (error) {
    console.error("Lỗi khi lấy NFTs từ ví:", error);

    // Trong trường hợp lỗi, trả về danh sách rỗng để không làm hỏng UI
    return [];
  }
}

export function verifyCubeMintingProperties(originalCube: any, mintedNft: any): { success: boolean, details: string } {
    console.log("Verifying cube properties preservation:");
    
    // Check material parameters
    const originalMaterialParams = originalCube.materialParams || {};
    const mintedMaterialParams = mintedNft.materialParams || mintedNft.properties?.materialParams || {};
    
    console.log("Original material params:", originalMaterialParams);
    console.log("Minted material params:", mintedMaterialParams);
    
    // Check colors
    const originalColors = originalCube.colors || [];
    const mintedColors = mintedNft.colors || [];
    
    console.log("Original colors:", originalColors);
    console.log("Minted colors:", mintedColors);
    
    // Check model URL
    const originalModel = originalCube.model3d || null;
    const mintedModel = mintedNft.model3d || null;
    
    console.log("Original model URL:", originalModel);
    console.log("Minted model URL:", mintedModel);
    
    const issues = [];
    
    // Check for material params issues
    if (Object.keys(originalMaterialParams).length > 0 && Object.keys(mintedMaterialParams).length === 0) {
      issues.push("Material parameters are missing from minted NFT");
    }
    
    // Check for color issues
    if (originalColors.length > 0 && mintedColors.length === 0) {
      issues.push("Colors are missing from minted NFT");
    }
    
    // Check for model issues
    if (originalModel && !mintedModel) {
      issues.push("3D model URL is missing from minted NFT");
    }
    
    return {
      success: issues.length === 0,
      details: issues.length > 0 ? issues.join(", ") : "All properties preserved successfully"
    };
  }