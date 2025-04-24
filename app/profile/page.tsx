"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import AbstractShape from "@/components/abstract-shape";
import PixelHeading from "@/components/pixel-heading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getWalletInfo,
  getNFTs,
  getTransactionHistory,
  shortenAddress,
  WalletData,
  NFTData,
} from "@/lib/services/walletService";
import {
  getModelViewerUrl,
  getDirectModelUrl,
  getGoogleModelViewerUrl,
} from "@/lib/services/pinataService";
import ModelViewer from "@/components/model-viewer";
import NFTCard from "@/components/nft-card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileEditModal from "@/components/profile-edit-modal";
import { ProfileData } from "@/lib/supabase/profileService";
import { supabase } from "@/lib/supabase/supabaseClient";
import { cubeCssStyles } from "@/components/nft-card";
import { PublicKey } from "@solana/web3.js";

export default function ProfilePage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);
  const [activeTab, setActiveTab] = useState("minted");
  const [isEditing, setIsEditing] = useState(false);
  const [listingPrice, setListingPrice] = useState("");
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<WalletData | null>(null);
  const [ownedNFTs, setOwnedNFTs] = useState<NFTData[]>([]);
  const [mintedNFTs, setMintedNFTs] = useState<NFTData[]>([]);
  const [listedNFTs, setListedNFTs] = useState<NFTData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const { publicKey, disconnect } = useWallet();
  const router = useRouter();
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTxDetails, setShowTxDetails] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [currentModelUrl, setCurrentModelUrl] = useState<string | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);
  const [modelLoadError, setModelLoadError] = useState<boolean>(false);
  const [hasLoadedProfile, setHasLoadedProfile] = useState<boolean>(false);
  const [dataLoadAttempted, setDataLoadAttempted] = useState<boolean>(false);

  // Portfolio data states
  const [portfolioValueHistory, setPortfolioValueHistory] = useState<any[]>([]);
  const [collectionDistribution, setCollectionDistribution] = useState<any[]>(
    []
  );
  const [transactionTypeData, setTransactionTypeData] = useState<any[]>([]);

  // New state for profile editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [fallbackModelUrls, setFallbackModelUrls] = useState<string[]>([]);
  const [currentNftForViewer, setCurrentNftForViewer] = useState<any>(null);

  // Use the Auth context
  const auth = useAuth();

  // Format wallet address
  const shortenAddress = (address: string, chars = 4) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

  // Format date for chart display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const loadWalletData = async () => {
      if (publicKey && !dataLoadAttempted) {
        setIsLoading(true);
        setDataLoadAttempted(true);

        try {
          // Get wallet info
          const walletData = await getWalletInfo(publicKey);
          setUserData(walletData);

          // Load NFTs using your improved function
          const nftData = await loadNFTsFromWallet(publicKey);
          setOwnedNFTs(nftData.ownedNFTs);
          setMintedNFTs(nftData.mintedNFTs);
          setListedNFTs(nftData.listedNFTs);

          // Process NFTs for cube rendering
          const processedNFTs = preprocessNFTsForCubeRendering(
            nftData.ownedNFTs
          );
          setOwnedNFTs(processedNFTs);

          // Get transaction history
          const txHistory = await getTransactionHistory(publicKey);

          // Format transaction history for UI
          const recentActivityData = txHistory.map((tx) => ({
            event: tx.type,
            item: `Transaction ${tx.signature.slice(0, 6)}...`,
            price: tx.amount,
            date: tx.blockTime,
            fullSignature: tx.fullSignature,
          }));

          setRecentActivity(recentActivityData);

          // Generate data for analytics charts
          generatePortfolioValueHistory(recentActivityData);
          generateCollectionDistribution(nftData.ownedNFTs);
          generateTransactionTypeData(txHistory);
        } catch (error) {
          console.error("Error loading wallet data:", error);
        } finally {
          setIsLoading(false);
          setLoading(false);
        }
      }
    };

    loadWalletData();
  }, [publicKey, dataLoadAttempted]);

  async function loadNFTsFromWallet(publicKey: PublicKey) {
    console.log(`Loading NFTs for wallet: ${publicKey.toString()}`);

    // List of reliable IPFS gateways to try
    const IPFS_GATEWAYS = [
      "https://gateway.pinata.cloud/ipfs/",
      "https://ipfs.io/ipfs/",
      "https://cloudflare-ipfs.com/ipfs/",
      "https://dweb.link/ipfs/",
      "https://gateway.ipfs.io/ipfs/",
      "https://ipfs.fleek.co/ipfs/",
    ];

    // Helper function to convert IPFS URI to HTTP URL
    const ipfsToHttpUrl = (ipfsUri: string, gatewayIndex = 0): string => {
      if (!ipfsUri) return "";

      // Use Pinata as first choice since it worked in your logs
      const gateway = IPFS_GATEWAYS[gatewayIndex];

      // Handle ipfs:// protocol
      if (ipfsUri.startsWith("ipfs://")) {
        const hash = ipfsUri.replace("ipfs://", "");
        return `${gateway}${hash}`;
      }

      // Handle /ipfs/ paths
      if (ipfsUri.includes("/ipfs/")) {
        const hash = ipfsUri.split("/ipfs/")[1];
        return `${gateway}${hash}`;
      }

      // If it's already an HTTP URL, return as is
      if (ipfsUri.startsWith("http")) {
        return ipfsUri;
      }

      // Assume it's a direct hash
      return `${gateway}${ipfsUri}`;
    };

    // Function to fetch metadata with multiple gateway fallbacks
    const fetchMetadataWithFallbacks = async (
      metadataUri: string
    ): Promise<any> => {
      console.log(`Attempting to fetch metadata from: ${metadataUri}`);

      // If not an IPFS URI, try direct fetch
      if (
        !metadataUri.startsWith("ipfs://") &&
        !metadataUri.includes("/ipfs/")
      ) {
        try {
          const response = await fetch(metadataUri);
          if (response.ok) {
            const metadata = await response.json();
            console.log(
              `Successfully fetched metadata from direct URL: ${metadataUri}`
            );
            return metadata;
          }
        } catch (error) {
          console.error(
            `Error fetching from primary URL: ${metadataUri}`,
            error
          );
        }
      }

      // For IPFS URIs or failed HTTP requests, try multiple gateways
      console.log(
        `Primary URL failed, trying alternative gateways for: ${metadataUri}`
      );

      for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
        try {
          const gatewayUrl = ipfsToHttpUrl(metadataUri, i);
          console.log(`Trying alternative IPFS gateway: ${gatewayUrl}`);

          const response = await fetch(gatewayUrl);
          if (response.ok) {
            const metadata = await response.json();
            console.log(
              `Successfully fetched metadata from alternative gateway: ${gatewayUrl}`
            );
            return metadata;
          }
        } catch (error) {
          console.error(
            `Alternative gateway failed: ${IPFS_GATEWAYS[i]}`,
            error
          );
        }
      }

      throw new Error(
        `Failed to fetch metadata from all sources: ${metadataUri}`
      );
    };

    try {
      // First get wallet NFTs using your existing service
      const nftData = await getNFTs(publicKey);

      // Process each NFT to ensure proper metadata extraction
      const processedNFTs = await Promise.all(
        nftData.ownedNFTs.map(async (nft) => {
          console.log(`Processing NFT: ${nft.name || nft.id}`);

          // Create a deep copy to avoid modifying the original
          const processedNft: NFTData & { imageHash?: string } = { ...nft };

          // Try to get metadata URI from the NFT
          let metadataUri = null;

          // Check direct uri field
          if ("uri" in nft && nft.uri) {
            metadataUri = nft.uri;
            console.log(
              `Found metadata URI in direct uri field: ${metadataUri}`
            );
          }
          // Check properties.metadata field
          else if (nft.properties?.metadata) {
            metadataUri = nft.properties.metadata;
            console.log(
              `Found metadata URI in properties.metadata: ${metadataUri}`
            );
          }

          // If we have a metadata URI, fetch the actual metadata
          if (metadataUri) {
            try {
              // Fetch metadata with gateway fallbacks
              const metadata = await fetchMetadataWithFallbacks(metadataUri);
              console.log(
                `Successfully fetched metadata for ${nft.name || nft.id}`
              );

              // Apply the real metadata properties to our NFT object
              processedNft.name = metadata.name || processedNft.name;
              processedNft.description =
                metadata.description || processedNft.description;

              // Get the actual image from metadata
              if (metadata.image) {
                let imageUrl = metadata.image;

                // Convert IPFS URI to HTTP if needed
                if (imageUrl.startsWith("ipfs://")) {
                  imageUrl = ipfsToHttpUrl(imageUrl);
                  console.log(`Converted IPFS image URL: ${imageUrl}`);
                }

                processedNft.image = imageUrl;
                console.log(`Set image URL: ${imageUrl}`);

                // Set fallback images with multiple gateways
                if (metadata.image.startsWith("ipfs://")) {
                  const ipfsHash = metadata.image.replace("ipfs://", "");
                  processedNft.imageHash = ipfsHash;
                  processedNft.fallbackImages = IPFS_GATEWAYS.map(
                    (gateway) => `${gateway}${ipfsHash}`
                  );
                }
              }

              // Extract 3D model URL from metadata
              if (metadata.animation_url || metadata.model) {
                let modelUrl = metadata.animation_url || metadata.model;

                // Convert IPFS URI to HTTP
                if (modelUrl.startsWith("ipfs://")) {
                  const ipfsHash = modelUrl.replace("ipfs://", "");
                  processedNft.model3dHash = ipfsHash;
                  modelUrl = ipfsToHttpUrl(modelUrl);
                }

                processedNft.model3d = modelUrl;
                console.log(`Set 3D model URL: ${modelUrl}`);

                // Set fallback model URLs with multiple gateways
                if (
                  (metadata.animation_url || metadata.model).startsWith(
                    "ipfs://"
                  )
                ) {
                  const ipfsHash = (
                    metadata.animation_url || metadata.model
                  ).replace("ipfs://", "");
                  (processedNft as any).fallbackModel3d = IPFS_GATEWAYS.map(
                    (gateway) => `${gateway}${ipfsHash}`
                  );
                }

                // Create model viewer URL
                processedNft.modelViewerUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(
                  modelUrl
                )}&ar=true&autoplay=true&autoRotate=true&cameraControls=true`;
              }

              // Extract attributes directly from the metadata
              if (metadata.attributes && metadata.attributes.length > 0) {
                processedNft.attributes = metadata.attributes;

                // Extract specific properties for display
                const colorAttr = metadata.attributes.find(
                  (attr: { trait_type: string }) =>
                    attr.trait_type === "Color" ||
                    attr.trait_type?.toLowerCase() === "color"
                );

                if (colorAttr?.value) {
                  processedNft.color = colorAttr.value;
                  console.log(`Found color attribute: ${processedNft.color}`);
                }

                const textureAttr = metadata.attributes.find(
                  (attr: { trait_type: string }) =>
                    attr.trait_type === "Texture"
                );

                if (textureAttr?.value) {
                  // Define texture property with type assertion
                  (processedNft as any).texture = textureAttr.value;
                  console.log(
                    `Found texture attribute: ${(processedNft as any).texture}`
                  );
                }

                const animationAttr = metadata.attributes.find(
                  (attr: { trait_type: string }) =>
                    attr.trait_type === "Animation"
                );

                if (animationAttr?.value) {
                  (processedNft as any).animation = animationAttr.value;
                  console.log(
                    `Found animation attribute: ${
                      (processedNft as any).animation
                    }`
                  );
                }

                const collectionAttr = metadata.attributes.find(
                  (attr: { trait_type: string }) =>
                    attr.trait_type === "Collection"
                );

                if (collectionAttr?.value) {
                  processedNft.collection = collectionAttr.value;
                  console.log(
                    `Found collection attribute: ${processedNft.collection}`
                  );
                }
              }

              // Get material params from properties if available
              if (metadata.properties?.materialParams) {
                (processedNft as any).materialParams =
                  metadata.properties.materialParams;
                console.log("Found material parameters in metadata");

                // Extract color from material params if not found in attributes
                if (
                  !processedNft.color &&
                  (processedNft as any).materialParams?.color
                ) {
                  processedNft.color = (
                    processedNft as any
                  ).materialParams.color;
                  console.log(
                    `Got color from materialParams: ${processedNft.color}`
                  );
                }

                // Check for gradient colors
                if ((processedNft as any).materialParams?.gradientColors) {
                  (processedNft as any).colors = (
                    processedNft as any
                  ).materialParams.gradientColors;
                  console.log(
                    `Got gradient colors from materialParams: ${(
                      processedNft as any
                    ).colors.join(", ")}`
                  );
                }
              }

              // Check for 3D model in properties.files
              if (
                metadata.properties?.files &&
                Array.isArray(metadata.properties.files)
              ) {
                for (const file of metadata.properties.files) {
                  // Skip if we already have a model
                  if (processedNft.model3d) break;

                  const fileUri =
                    typeof file === "string" ? file : file?.uri || file?.url;
                  const fileType =
                    typeof file === "object" ? file.type || "" : "";

                  const isLikelyModel =
                    fileUri?.includes(".glb") ||
                    fileUri?.includes(".gltf") ||
                    fileType.includes("model") ||
                    fileType.includes("glb") ||
                    fileType.includes("gltf");

                  if (fileUri && isLikelyModel) {
                    // Convert IPFS URI to HTTP if needed
                    if (fileUri.startsWith("ipfs://")) {
                      const ipfsHash = fileUri.replace("ipfs://", "");
                      processedNft.model3dHash = ipfsHash;
                      processedNft.model3d = ipfsToHttpUrl(fileUri);
                    } else {
                      processedNft.model3d = fileUri;
                    }

                    console.log(
                      `Found 3D model in files array: ${processedNft.model3d}`
                    );

                    // Create model viewer URL
                    // Create model viewer URL - with fallback value
                    processedNft.modelViewerUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(
                      processedNft.model3d || "" // Provide empty string as fallback
                    )}&ar=true&autoplay=true&autoRotate=true&cameraControls=true`;
                  }
                }
              }

              // Ensure the NFT type is set based on the metadata
              if (!processedNft.type) {
                // Check if it's a cube based on attributes or properties
                const isCube = processedNft.attributes?.some(
                  (attr: any) =>
                    (attr.trait_type === "Type" && attr.value === "Cube") ||
                    processedNft.name?.toLowerCase().includes("cube")
                );

                if (isCube) {
                  processedNft.type = "cube";
                  console.log(
                    `Set type to 'cube' based on metadata attributes`
                  );
                }
              }
            } catch (error) {
              console.error(
                `Error fetching metadata for NFT ${nft.name || nft.id}:`,
                error
              );
            }
          }

          // Ensure we have real colors array for cube rendering if we have a color
          if (
            processedNft.type === "cube" &&
            processedNft.color &&
            !(processedNft as any).colors
          ) {
            // Use type assertion to tell TypeScript that colors property can exist
            (processedNft as any).colors = generateColorShades(
              processedNft.color
            );
            console.log(
              `Generated color shades from base color: ${processedNft.color}`
            );
          }

          return processedNft;
        })
      );

      console.log(`Processed ${processedNFTs.length} NFTs`);
      return {
        ownedNFTs: processedNFTs,
        mintedNFTs: nftData.mintedNFTs,
        listedNFTs: nftData.listedNFTs,
      };
    } catch (error) {
      console.error("Error loading NFTs from wallet:", error);
      return {
        ownedNFTs: [],
        mintedNFTs: [],
        listedNFTs: [],
      };
    }
  }

  // Handle profile data from localStorage - separated from blockchain data loading
  useEffect(() => {
    if (publicKey && userData && !hasLoadedProfile) {
      try {
        const storageKey = `profile-${publicKey.toString()}`;
        const savedProfile = localStorage.getItem(storageKey);

        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);

          if (parsedProfile.username) {
            setUserData((prevData) => {
              if (!prevData) return prevData;
              return {
                ...prevData,
                displayName: parsedProfile.username,
              };
            });
          }
        }

        setHasLoadedProfile(true);
      } catch (err) {
        console.error("Error loading profile from localStorage:", err);
        setHasLoadedProfile(true);
      }
    }
  }, [publicKey, userData, hasLoadedProfile]);

  // Reset state variables when publicKey changes
  useEffect(() => {
    if (publicKey) {
      // Reset loading flags when wallet changes
      setDataLoadAttempted(false);
      setHasLoadedProfile(false);
    }
  }, [publicKey]);

  const preprocessNFTsForCubeRendering = (nfts: any[]) => {
    console.log(`Processing ${nfts.length} NFTs for display`);

    return nfts.map((nft) => {
      // Create a deep copy to avoid modifying the original
      const processedNft = { ...nft };

      console.log(`Processing NFT: ${processedNft.name} (${processedNft.id})`);

      // IMPROVED DETECTION LOGIC FOR NFT TYPES
      // 1. Detect music NFTs first
      const isMusicNFT =
        processedNft.type === "music" ||
        (processedNft.audioUrl && !processedNft.type?.includes("cube")) ||
        (processedNft.name &&
          processedNft.name.toLowerCase().includes("music") &&
          !processedNft.name.toLowerCase().includes("cube")) ||
        (processedNft.attributes &&
          processedNft.attributes.some(
            (attr: any) => attr.trait_type === "Type" && attr.value === "Music"
          ));

      // 2. Then check for cubes
      const isCubeNFT =
        !isMusicNFT &&
        (processedNft.type === "cube" ||
          (processedNft.name &&
            processedNft.name.toLowerCase().includes("cube")) ||
          (processedNft.attributes &&
            processedNft.attributes.some(
              (attr: any) =>
                (attr.trait_type === "Type" && attr.value === "Cube") ||
                (attr.trait_type === "Collection" &&
                  typeof attr.value === "string" &&
                  attr.value.includes("VOID Cube"))
            )));

      // Set type if needed
      if (isMusicNFT && !processedNft.type) {
        processedNft.type = "music";
        console.log(`Set type to 'music'`);
      } else if (isCubeNFT && !processedNft.type) {
        processedNft.type = "cube";
        console.log(`Set type to 'cube'`);
      }

      // For music NFTs, always use pink
      if (isMusicNFT) {
        processedNft.color = "#ec4899"; // Pink for music
        processedNft.colors = []; // NFTCard will generate shades from color
        console.log(`Set music NFT color to pink: ${processedNft.color}`);
        return processedNft;
      }

      // For cube NFTs, process all the model information
      if (isCubeNFT) {
        console.log(
          `Converting NFT for cube rendering: ${
            processedNft.name || processedNft.id
          }`
        );

        // --------- EXTRACT 3D MODEL INFORMATION ---------
        // NEW SECTION: Extract 3D model info from properties
        if (processedNft.properties) {
          // Look for model URI in properties
          if (
            processedNft.properties.model &&
            typeof processedNft.properties.model === "string"
          ) {
            console.log(
              `Found model URI in properties: ${processedNft.properties.model}`
            );

            // Check if it's an IPFS URI
            if (processedNft.properties.model.startsWith("ipfs://")) {
              const ipfsHash = processedNft.properties.model.replace(
                "ipfs://",
                ""
              );
              processedNft.model3dHash = ipfsHash;
              processedNft.model3d = convertIpfsToHttpUrl(ipfsHash);
              console.log(
                `Converted IPFS model URI to HTTP: ${processedNft.model3d}`
              );
            } else {
              processedNft.model3d = processedNft.properties.model;
            }
          }

          // Also check for animation_url which is often used for 3D models
          if (!processedNft.model3d && processedNft.properties.animation_url) {
            console.log(
              `Found animation_url in properties: ${processedNft.properties.animation_url}`
            );

            if (processedNft.properties.animation_url.startsWith("ipfs://")) {
              const ipfsHash = processedNft.properties.animation_url.replace(
                "ipfs://",
                ""
              );
              processedNft.model3dHash = ipfsHash;
              processedNft.model3d = convertIpfsToHttpUrl(ipfsHash);
            } else {
              processedNft.model3d = processedNft.properties.animation_url;
            }
          }

          // Check in files array for 3D model
          if (
            !processedNft.model3d &&
            processedNft.properties.files &&
            Array.isArray(processedNft.properties.files)
          ) {
            const modelFile = processedNft.properties.files.find(
              (file: any) =>
                file.type === "model/gltf-binary" ||
                file.type === "model/gltf+json" ||
                (file.uri && file.uri.includes(".glb"))
            );

            if (modelFile && modelFile.uri) {
              console.log(`Found model in properties.files: ${modelFile.uri}`);

              if (modelFile.uri.startsWith("ipfs://")) {
                const ipfsHash = modelFile.uri.replace("ipfs://", "");
                processedNft.model3dHash = ipfsHash;
                processedNft.model3d = convertIpfsToHttpUrl(ipfsHash);
              } else {
                processedNft.model3d = modelFile.uri;
              }
            }
          }

          // Extract material params from properties if available
          if (processedNft.properties.materialParams) {
            console.log(`Found material params in properties`);
            processedNft.materialParams =
              processedNft.properties.materialParams;
          }
        }

        // If we still don't have a model URL but we have a model3dHash, create the URL
        if (!processedNft.model3d && processedNft.model3dHash) {
          processedNft.model3d = convertIpfsToHttpUrl(processedNft.model3dHash);
          console.log(`Created model URL from hash: ${processedNft.model3d}`);
        }

        // Set modelViewerUrl if we have a model3d URL
        if (processedNft.model3d && !processedNft.modelViewerUrl) {
          processedNft.modelViewerUrl = getModelViewerUrl(processedNft.model3d);
          console.log(
            `Created model viewer URL: ${processedNft.modelViewerUrl}`
          );
        }

        // EXTRACT COLORS - IDENTICAL TO REALM CUBE COMPONENT
        let colors = null;

        // 1. First try to extract from attributes (for VOID Cubes)
        const colorAttr = processedNft.attributes?.find(
          (attr: any) =>
            attr.trait_type === "Color" ||
            attr.trait_type?.toLowerCase() === "color"
        );

        if (colorAttr?.value) {
          console.log(`Extracted color from attributes: ${colorAttr.value}`);
          const primaryColor = colorAttr.value;

          // Generate color array from primary color
          processedNft.color = primaryColor;
          colors = generateColorShades(primaryColor);
        }

        // 2. If no colors yet, try to extract from metadata.materialParams
        if (
          !colors &&
          (processedNft.metadata?.materialParams?.color ||
            processedNft.materialParams?.color)
        ) {
          const color =
            processedNft.metadata?.materialParams?.color ||
            processedNft.materialParams?.color;
          console.log(`Found color in materialParams: ${color}`);
          processedNft.color = color;
          colors = generateColorShades(color);
        }

        // 3. Check for gradient colors in metadata
        if (
          !colors &&
          (processedNft.metadata?.materialParams?.gradientColors ||
            processedNft.materialParams?.gradientColors)
        ) {
          const gradientColors =
            processedNft.metadata?.materialParams?.gradientColors ||
            processedNft.materialParams?.gradientColors;
          if (Array.isArray(gradientColors) && gradientColors.length > 0) {
            console.log(`Found gradient colors: ${gradientColors.join(", ")}`);
            processedNft.color = gradientColors[0]; // Use first color as primary
            colors = gradientColors;

            // Ensure we have 6 colors
            while (colors.length < 6) {
              colors.push(
                adjustColorBrightness(colors[0], -0.1 * colors.length)
              );
            }
          }
        }

        // 4. If still no colors, extract from name
        if (!colors && processedNft.name) {
          const colorFromName = extractColorFromName(processedNft.name);
          if (colorFromName) {
            console.log(`Extracted color from name: ${colorFromName}`);
            processedNft.color = colorFromName;
            colors = generateColorShades(colorFromName);
          }
        }

        // 5. If still no colors, use deterministic fallback based on NFT ID
        if (!colors || colors.length === 0) {
          // Hash the ID in the same way as RealmCube
          const hash = processedNft.id
            .split("")
            .reduce((a: number, b: string) => a + b.charCodeAt(0), 0);

          // Use RealmCube's exact default colors array
          const defaultColors = [
            "#8b5cf6", // Cosmic Void (purple)
            "#0ea5e9", // Crystal Blue
            "#22c55e", // Emerald Matrix
            "#fbbf24", // Golden Relic
            "#ff00ff", // Pink Neon
            "#18181b", // Obsidian Void
          ];

          const primaryColor = defaultColors[hash % defaultColors.length];
          console.log(
            `Using deterministic fallback color from ID hash: ${primaryColor}`
          );
          processedNft.color = primaryColor;
          colors = generateColorShades(primaryColor);
        }

        // Set color array to NFT
        processedNft.colors = colors;

        // Get accent color from first color
        const accentColor = colors[0];

        // Create border color and glow effect (exactly like RealmCube)
        const borderColor = `rgba(${hexToRgb(accentColor)}, 0.5)`;
        const glow = `0 0 25px rgba(${hexToRgb(accentColor)}, 0.7)`;

        // Add these properties to match RealmCube's cube object format
        processedNft.accentColor = accentColor;
        processedNft.borderColor = borderColor;
        processedNft.glow = glow;

        // Extract texture information for display
        const textureAttr = processedNft.attributes?.find(
          (attr: any) => attr.trait_type === "Texture"
        );
        const texture = textureAttr?.value || "";
        processedNft.texture = texture;

        // Extract animation for special effects
        const animationAttr = processedNft.attributes?.find(
          (attr: any) => attr.trait_type === "Animation"
        );
        const animation = animationAttr?.value || "";
        processedNft.animation = animation;

        // Assign rarity based on attributes or default to rare for NFTs
        if (!processedNft.rarity) {
          let rarity = "rare";
          const rarityAttr = processedNft.attributes?.find(
            (attr: any) => attr.trait_type === "Rarity"
          );
          if (rarityAttr?.value) {
            rarity = rarityAttr.value.toLowerCase();
          }
          processedNft.rarity = rarity;
        }

        // Mark as cube NFT
        processedNft.isNFT = true;

        console.log(`Final cube NFT colors:`, processedNft.colors);
      }

      return processedNft;
    });
  };

  // Convert IPFS hash to HTTP URL
  function convertIpfsToHttpUrl(ipfsHash: string): string {
    // Use multiple gateways for reliability
    const gateway = "https://ipfs.io/ipfs/";
    return `${gateway}${ipfsHash}`;
  }

  // Create modelViewerUrl for 3D model viewing
  function getModelViewerUrl(modelUrl: string): string {
    // If it's already a viewer URL, return it
    if (
      modelUrl.includes("modelviewer.dev") ||
      modelUrl.includes("viewer.html")
    ) {
      return modelUrl;
    }

    // Otherwise create a new modelviewer URL
    return `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(
      modelUrl
    )}&ar=true&autoplay=true&autoRotate=true&cameraControls=true`;
  }

  // Extract color from name - IDENTICAL to realm-cube.tsx
  function extractColorFromName(name: string): string | null {
    // Expanded color map with more variations
    const colorMap: Record<string, string> = {
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

  // Generate color shades - IDENTICAL to realm-cube.tsx
  const generateColorShades = (baseColor: string): string[] => {
    // Ensure base color is in correct format
    if (!baseColor.startsWith("#")) {
      baseColor = `#${baseColor}`;
    }

    // If it's still not a valid hex color, use a default
    if (!/^#[0-9A-F]{6}$/i.test(baseColor)) {
      baseColor = "#8b5cf6"; // Default purple
    }

    // Generate shades with better contrast
    return [
      baseColor,
      adjustColorBrightness(baseColor, -0.1),
      adjustColorBrightness(baseColor, -0.2),
      adjustColorBrightness(baseColor, -0.3),
      adjustColorBrightness(baseColor, -0.4),
      adjustColorBrightness(baseColor, -0.5),
    ];
  };

  // Convert hex to rgb - IDENTICAL to realm-cube.tsx
  const hexToRgb = (hex: string): string => {
    // Remove # if present
    hex = hex.replace(/^#/, "");

    // Parse hex values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `${r}, ${g}, ${b}`;
  };

  // Adjust color brightness - IDENTICAL to realm-cube.tsx
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

  // Generate portfolio value history
  const generatePortfolioValueHistory = (transactions: string | any[]) => {
    if (!transactions || transactions.length === 0) {
      setPortfolioValueHistory([]);
      return;
    }

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let balance = 0;
    const historyData = sortedTransactions.map((tx) => {
      // Simulate balance changes based on transaction type
      if (tx.event === "Mint") {
        balance -= tx.price; // Cost of minting
      } else if (tx.event === "Transfer" && tx.price > 0) {
        balance += tx.price; // Received funds
      }

      return {
        date: formatDate(tx.date),
        value: parseFloat((balance + Math.random() * 2).toFixed(2)), // Add some randomness for visual appeal
        fullDate: tx.date,
      };
    });

    // Add today's point
    const today = new Date();
    historyData.push({
      date: formatDate(today.toISOString()),
      value: parseFloat((balance + 2 + Math.random() * 3).toFixed(2)),
      fullDate: today.toISOString(),
    });

    setPortfolioValueHistory(historyData);
  };

  // Generate collection distribution data
  const generateCollectionDistribution = (nfts: any[]) => {
    if (!nfts || nfts.length === 0) {
      setCollectionDistribution([]);
      return;
    }

    // Group NFTs by collection
    const collections: { [key: string]: number } = {};
    nfts.forEach((nft) => {
      const collection = nft.collection || "Unknown";
      if (!collections[collection]) {
        collections[collection] = 0;
      }
      collections[collection]++;
    });

    // Convert to array for pie chart
    const distributionData = Object.keys(collections).map((collection) => ({
      name: collection,
      value: collections[collection],
    }));

    setCollectionDistribution(distributionData);
  };

  // Generate transaction type data
  const generateTransactionTypeData = (transactions: any[]) => {
    if (!transactions || transactions.length === 0) {
      setTransactionTypeData([]);
      return;
    }

    // Group transactions by type
    const types: Record<string, number> = {};
    transactions.forEach((tx) => {
      const type = tx.type || "Unknown";
      if (!types[type]) {
        types[type] = 0;
      }
      types[type]++;
    });

    // Convert to array for visualization
    const typeData = Object.keys(types).map((type) => ({
      name: type,
      value: types[type],
    }));

    setTransactionTypeData(typeData);
  };

  // Try to load image and use fallback if needed
  const tryLoadImage = (primaryUrl: string, fallbackUrls?: string[]) => {
    const imgElement = document.createElement("img");
    imgElement.src = primaryUrl;

    imgElement.onerror = () => {
      console.log(`Cannot load image from: ${primaryUrl}`);
      if (fallbackUrls && fallbackUrls.length > 0) {
        // Try each fallback URL in order
        let fallbackIndex = 0;
        const tryNextFallback = () => {
          if (fallbackIndex < fallbackUrls.length) {
            const imgElement = document.createElement("img");
            imgElement.src = fallbackUrls[fallbackIndex];
            imgElement.onerror = () => {
              console.log(
                `Cannot load image from fallback: ${fallbackUrls[fallbackIndex]}`
              );
              fallbackIndex++;
              tryNextFallback();
            };
            imgElement.onload = () => {
              console.log(
                `Successfully loaded image from: ${fallbackUrls[fallbackIndex]}`
              );
              // Update src in DOM for all images with primary URL
              const imageElements = document.querySelectorAll(
                `img[src="${primaryUrl}"]`
              );
              imageElements.forEach((img) => {
                img.setAttribute("src", fallbackUrls[fallbackIndex]);
              });
            };
          }
        };
        tryNextFallback();
      }
    };
  };

  // Update refreshImageURLs to use tryLoadImage
  const refreshImageURLs = (nfts: any[]) => {
    nfts.forEach((nft) => {
      if (nft.image) {
        // Try to load main image and use fallback if needed
        tryLoadImage(nft.image, nft.fallbackImages);
      }

      // Ensure required properties exist
      if (!nft.name) nft.name = `VOID NFT #${nft.id.substring(0, 6)}`;
      if (!nft.description) nft.description = "A unique VOID NFT";

      // Update NFT with visual data
      const updatedNft = {
        ...nft,
        color: getRandomColor(),
        type: nft.type || "cube",
        shapeType: getRandomShapeType(),
        collection: "VOID Collection",
      };

      // Ensure model3d URL is valid if model3dHash exists
      if (updatedNft.model3dHash) {
        updatedNft.model3d = `https://ipfs.io/ipfs/${updatedNft.model3dHash}`;
        if (updatedNft.fallbackModel3d) {
          // Try to load model3d
          tryLoadModel(updatedNft.model3d, updatedNft.fallbackModel3d);
        }
      }

      return updatedNft;
    });
  };

  // Try to load 3D model
  const tryLoadModel = (primaryUrl: string, fallbackUrls?: string[]) => {
    const modelTest = document.createElement("a");
    modelTest.href = primaryUrl;

    fetch(primaryUrl, { method: "HEAD" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Invalid model URL");
        }
        console.log("Valid model URL:", primaryUrl);
      })
      .catch((error) => {
        console.log(`Cannot load model from: ${primaryUrl}`, error);
        if (fallbackUrls && fallbackUrls.length > 0) {
          // Try each fallback URL in order
          tryNextModelFallback(fallbackUrls, 0);
        }
      });
  };

  const tryNextModelFallback = (fallbackUrls: string[], index: number) => {
    if (index >= fallbackUrls.length) return;

    fetch(fallbackUrls[index], { method: "HEAD" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Fallback model URL is not valid");
        }
        console.log("Found valid model URL:", fallbackUrls[index]);
        // Update in DOM if needed
      })
      .catch((error) => {
        console.log(
          `Cannot load model from fallback: ${fallbackUrls[index]}`,
          error
        );
        tryNextModelFallback(fallbackUrls, index + 1);
      });
  };

  const handleListNFT = (nftId: string) => {
    setSelectedNFT(nftId);
    setIsEditing(true);
  };

  const handleConfirmListing = () => {
    // This would be replaced with actual listing logic
    console.log(`Listing NFT #${selectedNFT} for ${listingPrice} SOL`);
    setIsEditing(false);
    setSelectedNFT(null);
    setListingPrice("");
  };

  const handleCancelListing = () => {
    setIsEditing(false);
    setSelectedNFT(null);
    setListingPrice("");
  };

  // Handle disconnection with Auth context
  const handleDisconnect = async () => {
    try {
      // Use the auth context to logout, which will also disconnect wallet
      if (auth.isAuthenticated) {
        await auth.logout();
      } else {
        // Fallback to direct wallet disconnect if not authenticated
        await disconnect();
      }
      console.log("Disconnecting wallet...");
      // Redirect to home page after disconnecting
      router.push("/");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  // Handle update of profile
  const handleProfileUpdate = async (updatedProfile: {
    username: string;
    avatar_url?: string;
  }) => {
    try {
      // Update UI state immediately for responsive UX
      if (userData) {
        setUserData({
          ...userData,
          displayName: updatedProfile.username,
        });
      }

      if (publicKey) {
        // Store in localStorage as backup
        const storageKey = `profile-${publicKey.toString()}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedProfile));

        // Direct Supabase operation
        console.log("Attempting direct Supabase update with:", {
          walletAddress: publicKey.toString(),
          username: updatedProfile.username,
          avatarUrl: updatedProfile.avatar_url,
        });

        try {
          // Check if profile exists
          const { data: existingProfile, error: fetchError } = await supabase
            .from("profiles")
            .select("*")
            .eq("wallet_address", publicKey.toString())
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error checking for existing profile:", fetchError);
          }

          if (existingProfile) {
            // Update existing profile
            const { data, error } = await supabase
              .from("profiles")
              .update({
                username: updatedProfile.username,
                avatar_url: updatedProfile.avatar_url,
                updated_at: new Date().toISOString(),
              })
              .eq("wallet_address", publicKey.toString());

            if (error) {
              console.error("Error updating profile:", error);
            } else {
              console.log(
                "Profile updated successfully via direct Supabase call"
              );
            }
          } else {
            // Insert new profile
            const { data, error } = await supabase.from("profiles").insert([
              {
                wallet_address: publicKey.toString(),
                username: updatedProfile.username,
                avatar_url: updatedProfile.avatar_url,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);

            if (error) {
              console.error("Error creating profile:", error);
            } else {
              console.log(
                "Profile created successfully via direct Supabase call"
              );
            }
          }
        } catch (dbError) {
          console.error("Supabase operation failed:", dbError);
        }

        // Also try auth context for completeness
        if (auth.isAuthenticated) {
          try {
            await auth.updateProfile({
              username: updatedProfile.username,
              avatar_url: updatedProfile.avatar_url,
            });
            console.log("Profile also updated via auth context");
          } catch (authError) {
            console.error("Auth context update failed:", authError);
            // Continue anyway since we already tried direct update
          }
        }

        // Force image refresh with cache buster
        if (updatedProfile.avatar_url) {
          // Create a new URL with timestamp to force refresh
          const refreshedAvatarUrl = updatedProfile.avatar_url.includes("?")
            ? `${updatedProfile.avatar_url}&t=${Date.now()}`
            : `${updatedProfile.avatar_url}?t=${Date.now()}`;

          // Update the local state to use this refreshed URL
          if (auth.profile) {
            auth.refreshProfile(); // If you have this method in your auth context
          }

          // Force the page to recognize the new image
          setTimeout(() => {
            // This will trigger a small UI update without a full page refresh
            setUserData((prevData) => (prevData ? { ...prevData } : null));
          }, 500);
        }
      }
    } catch (error) {
      console.error("Profile update failed completely:", error);
      alert("Failed to update profile. Please try again later.");
    }
  };

  // Handle transaction details display
  const handleShowTxDetails = (tx: any) => {
    console.log("Transaction details:", tx);
    console.log("Full signature:", tx.fullSignature);
    setSelectedTx(tx);
    setShowTxDetails(true);
  };

  const handleCloseTxDetails = () => {
    setShowTxDetails(false);
    setSelectedTx(null);
  };

  // Return random color for NFT
  const getRandomColor = () => {
    const colors = ["purple", "pink", "blue"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Return random shape type for NFT
  const getRandomShapeType = () => {
    const types = ["complex", "grid", "wave", "dots", "noise"];
    return types[Math.floor(Math.random() * types.length)];
  };

  // Handle watch 3D model button press
  // Update the handleViewModel function in page.tsx

  const handleViewModel = async (nft: any) => {
    setModelLoadError(false);
    setIsLoadingModel(true);

    try {
      console.log("Opening 3D model viewer for:", nft.name);

      let modelUrl = null;
      let fallbackUrls: string[] = [];

      // Check for model3d URL directly in the NFT
      if (nft.model3d) {
        console.log("Using model3d URL:", nft.model3d);
        modelUrl = nft.model3d;

        // If it's an IPFS URL, prepare alternative gateway URLs
        if (nft.model3d.startsWith("ipfs://")) {
          const hash = nft.model3d.replace("ipfs://", "");
          // Prioritize Pinata gateway (worked in your logs)
          modelUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;

          // Add fallback URLs
          fallbackUrls = [
            `https://ipfs.filebase.io/ipfs/${hash}`,
            `https://dweb.link/ipfs/${hash}`,
            `https://ipfs.io/ipfs/${hash}`,
            `https://nftstorage.link/ipfs/${hash}`,
            `https://w3s.link/ipfs/${hash}`,
            `https://cloudflare-ipfs.com/ipfs/${hash}`,
          ];
        }
      }
      // Check for model3dHash
      else if (nft.model3dHash) {
        console.log("Using model3dHash:", nft.model3dHash);

        // Prioritize Pinata gateway as primary URL
        modelUrl = `https://gateway.pinata.cloud/ipfs/${nft.model3dHash}`;

        // Add fallback URLs
        fallbackUrls = [
          `https://ipfs.filebase.io/ipfs/${nft.model3dHash}`,
          `https://dweb.link/ipfs/${nft.model3dHash}`,
          `https://ipfs.io/ipfs/${nft.model3dHash}`,
          `https://nftstorage.link/ipfs/${nft.model3dHash}`,
          `https://w3s.link/ipfs/${nft.model3dHash}`,
          `https://cloudflare-ipfs.com/ipfs/${nft.model3dHash}`,
        ];
      }
      // Check modelViewerUrl
      else if (nft.modelViewerUrl) {
        console.log("Using model viewer URL:", nft.modelViewerUrl);
        modelUrl = nft.modelViewerUrl;
      }

      // If we have a direct URL, add model viewer URL as fallback
      if (modelUrl && !modelUrl.includes("modelviewer.dev")) {
        fallbackUrls.push(
          `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(
            modelUrl
          )}&ar=true&autoplay=true&autoRotate=true&cameraControls=true`
        );
      }

      // Add any additional fallback URLs from the NFT
      if (nft.fallbackModel3d && Array.isArray(nft.fallbackModel3d)) {
        fallbackUrls = [...fallbackUrls, ...nft.fallbackModel3d];
      }

      // Remove duplicates
      fallbackUrls = [...new Set(fallbackUrls)];

      // If no URL found, use sample model
      if (!modelUrl) {
        console.warn("No 3D model URL found, using sample model");
        modelUrl = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
      }

      console.log("Model URL:", modelUrl);
      console.log("Fallback URLs:", fallbackUrls);

      // Set URLs and show viewer
      setCurrentModelUrl(modelUrl);
      setFallbackModelUrls(fallbackUrls);
      setCurrentNftForViewer(nft);
      setShowModelViewer(true);
    } catch (error) {
      console.error("Error preparing model viewer:", error);
      setModelLoadError(true);
      setCurrentModelUrl(
        "https://modelviewer.dev/shared-assets/models/Astronaut.glb"
      );
      setShowModelViewer(true);
    } finally {
      setIsLoadingModel(false);
    }
  };

  // Handle error when iframe fails to load
  const handleModelViewerError = () => {
    console.error("Error loading the model viewer.");
    // Try again with sample model
    setCurrentModelUrl(
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb"
    );
  };

  // Close 3D model modal
  const handleCloseModelViewer = () => {
    setShowModelViewer(false);
    setCurrentModelUrl(null);
  };

  // Colors for pie chart
  const COLORS = ["#a855f7", "#ec4899", "#3b82f6", "#6366f1", "#10b981"];

  // Custom tooltip for portfolio chart
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-purple-500 p-2 font-pixel text-sm">
          <p className="text-white">{`Date: ${label}`}</p>
          <p className="text-purple-400">{`Value: ${payload[0].value} SOL`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative bg-black text-white overflow-hidden font-pixel">
      {/* Custom cursor */}
      <motion.div
        className="fixed w-8 h-8 pointer-events-none z-[100] hidden md:block"
        animate={{
          x: cursorPosition.x - 16,
          y: cursorPosition.y - 16,
          scale: cursorHover ? 1.5 : 1,
        }}
        transition={{ type: "spring", damping: 10, mass: 0.1, stiffness: 100 }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="0" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="12" y="12" width="8" height="8" fill="#ec4899" />
        </svg>
      </motion.div>

      {/* Navigation */}
      <Navigation />

      {loading || auth.isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AbstractShape
              className="w-20 h-20 mx-auto text-purple-500 animate-pulse"
              type="complex"
              animate
            />
            <p className="text-xl font-pixel mt-4">LOADING DATA...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Profile Header */}
          <section className="relative pt-32 pb-20">
            <div className="absolute inset-0 z-0 h-[50vh] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <AbstractShape
                  className="w-full h-full text-purple-500/10"
                  type="grid"
                  animate
                />
              </div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
                  <div className="flex items-center mb-6 md:mb-0">
                    {/* Profile Avatar - Use Supabase profile avatar if available */}
                    <div className="w-20 h-20 mr-6 relative overflow-hidden rounded-full">
                      {auth.profile && auth.profile.avatar_url ? (
                        <img
                          src={auth.profile.avatar_url}
                          alt="User avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full">
                          <AbstractShape
                            className="w-full h-full text-purple-500"
                            type="complex"
                            animate
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-white"
                              >
                                <path
                                  d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      {/* Use Supabase profile username if available */}
                      <h1 className="text-3xl font-bold text-white mb-2 font-pixel">
                        {auth.profile
                          ? auth.profile.username
                          : userData?.displayName}
                      </h1>
                      <div className="flex items-center">
                        <span className="text-gray-400 text-sm font-pixel mr-2">
                          JOINED {userData?.joinedDate}
                        </span>
                        <div className="flex items-center bg-purple-900/30 px-2 py-1">
                          <span className="text-purple-400 text-xs font-pixel truncate max-w-[120px] md:max-w-none">
                            {userData ? shortenAddress(userData.address) : ""}
                          </span>
                          <button
                            aria-label="Copy wallet address"
                            title="Copy wallet address"
                            className="ml-2 text-gray-400 hover:text-white transition-colors"
                            onClick={() => {
                              if (userData) {
                                navigator.clipboard.writeText(userData.address);
                                alert("Wallet address copied to clipboard!");
                              }
                            }}
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21H17C18.1046 21 19 20.1046 19 19V16M21 3H13V11H21V3Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    {/* Edit Profile Button - Opens the profile edit modal */}
                    <Button
                      className="bg-transparent border border-purple-500 hover:bg-purple-950/30 text-purple-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      EDIT PROFILE
                    </Button>
                    <Button
                      onClick={handleDisconnect}
                      className="bg-transparent border border-pink-500 hover:bg-pink-950/30 text-pink-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      DISCONNECT
                    </Button>
                  </div>
                </div>

                {/* Wallet Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  {[
                    {
                      label: "BALANCE",
                      value: userData
                        ? `${userData.balance.toFixed(2)} SOL`
                        : "0 SOL",
                    },
                    {
                      label: "PORTFOLIO VALUE",
                      value: userData
                        ? `${userData.totalValue.toFixed(2)} SOL`
                        : "0 SOL",
                    },
                    {
                      label: "TRANSACTIONS",
                      value: userData?.transactions || 0,
                    },
                    {
                      label: "NFTS OWNED",
                      value: ownedNFTs?.length || userData?.nftsOwned || 0,
                    },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-black border border-purple-900/50 p-6"
                    >
                      <h3 className="text-gray-400 text-sm mb-2 font-pixel">
                        {stat.label}
                      </h3>
                      <p className="text-2xl font-bold text-white font-pixel">
                        {stat.value}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* NFT Tabs */}
                <Tabs
                  defaultValue="minted"
                  className="w-full"
                  onValueChange={(value) => setActiveTab(value)}
                >
                  <div className="flex justify-center mb-10">
                    <TabsList className="bg-black border-2 border-purple-900 p-1 rounded-none">
                      <TabsTrigger
                        value="minted"
                        className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        OWNED NFTs
                      </TabsTrigger>
                      <TabsTrigger
                        value="listed"
                        className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        LISTED NFTs
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Owned NFTs Tab */}
                  <TabsContent value="minted" className="mt-0">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-20">
                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : ownedNFTs.length === 0 ? (
                      <div className="text-center py-20">
                        <AbstractShape
                          className="w-24 h-24 mx-auto text-purple-500/30 mb-6"
                          type="grid"
                        />
                        <h3 className="text-2xl font-bold text-white mb-4 font-pixel">
                          NO NFTs FOUND
                        </h3>
                        <p className="text-gray-400 mb-6 font-pixel">
                          You don't have any NFTs in your wallet yet.
                        </p>
                        <Button
                          asChild
                          className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 text-lg font-pixel tracking-wide"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          <Link href="/ai">MINT NEW NFT</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {ownedNFTs.map((nft, index) => (
                          <NFTCard
                            key={nft.id || index}
                            nft={{
                              ...nft,
                              image: nft.image || "",
                              mintedAt:
                                nft.mintedAt || new Date().toISOString(),
                              description:
                                nft.description || "A unique VOID NFT",
                              rarity:
                                nft.rarity !== undefined
                                  ? String(nft.rarity)
                                  : undefined,
                              shapeType: [
                                "complex",
                                "grid",
                                "wave",
                                "dots",
                                "noise",
                              ].includes(nft.shapeType)
                                ? (nft.shapeType as
                                    | "complex"
                                    | "grid"
                                    | "wave"
                                    | "dots"
                                    | "noise")
                                : undefined,
                            }}
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                            onViewModelClick={handleViewModel}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Listed NFTs Tab */}
                  <TabsContent value="listed" className="mt-0">
                    {listedNFTs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {listedNFTs.map((nft) => (
                          <motion.div
                            key={nft.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-black border border-purple-900/50 group hover:border-purple-500 transition-colors duration-300"
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          >
                            <div className="aspect-square overflow-hidden relative">
                              <AbstractShape
                                className={`w-full h-full ${
                                  nft.color === "purple"
                                    ? "text-purple-500/70"
                                    : nft.color === "pink"
                                    ? "text-pink-500/70"
                                    : "text-blue-500/70"
                                }`}
                                type={nft.shapeType as any}
                                animate
                              />
                              {nft.type === "music" && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                    <svg
                                      width="20"
                                      height="20"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="text-white"
                                    >
                                      <path
                                        d="M8 5.14V19.14L19 12.14L8 5.14Z"
                                        fill="currentColor"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="text-lg font-bold text-white mb-1 font-pixel">
                                {nft.name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-3 font-pixel">
                                {nft.collection}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="text-purple-400 font-bold font-pixel">
                                  {nft.price} SOL
                                </span>
                                <div className="flex items-center">
                                  <div className="text-xs text-gray-400 font-pixel mr-2">
                                    {nft.listed}
                                  </div>
                                  <Button
                                    className="bg-transparent border border-red-500/50 hover:bg-red-950/30 text-red-400 rounded-none px-3 py-1 text-xs font-pixel tracking-wide"
                                    onMouseEnter={() => setCursorHover(true)}
                                    onMouseLeave={() => setCursorHover(false)}
                                  >
                                    CANCEL
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <AbstractShape
                          className="w-24 h-24 mx-auto text-purple-500/30 mb-6"
                          type="grid"
                        />
                        <h3 className="text-2xl font-bold text-white mb-4 font-pixel">
                          NO LISTED NFTS
                        </h3>
                        <p className="text-gray-400 mb-6 font-pixel">
                          You haven't listed any NFTs for sale yet.
                        </p>
                        <Button
                          asChild
                          className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 text-lg font-pixel tracking-wide"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          <Link href="#owned">LIST AN NFT</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>

          {/* Listing Modal */}
          {isEditing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black border-2 border-purple-500 p-8 max-w-md w-full"
              >
                <h3 className="text-2xl font-bold text-white mb-6 font-pixel">
                  LIST NFT FOR SALE
                </h3>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2 font-pixel">
                    PRICE (SOL)
                  </label>
                  <Input
                    type="number"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="0.00"
                    className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  />
                </div>
                <div className="flex space-x-4">
                  <Button
                    onClick={handleConfirmListing}
                    disabled={!listingPrice}
                    className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide flex-1"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    CONFIRM
                  </Button>
                  <Button
                    onClick={handleCancelListing}
                    className="bg-transparent border-2 border-pink-500 hover:bg-pink-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide flex-1"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    CANCEL
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Enhanced Activity Section */}
          <section className="relative py-20 bg-purple-950/10">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <PixelHeading
                  text="RECENT ACTIVITY"
                  className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
                />

                {/* Enhanced Transaction Table */}
                <div className="border border-purple-900/50 mb-8">
                  <div className="grid grid-cols-4 gap-4 p-4 border-b border-purple-900/50 bg-purple-950/10">
                    <p className="text-gray-400 font-pixel font-bold">EVENT</p>
                    <p className="text-gray-400 font-pixel font-bold">ITEM</p>
                    <p className="text-gray-400 font-pixel font-bold">PRICE</p>
                    <p className="text-gray-400 font-pixel font-bold">DATE</p>
                  </div>
                  {recentActivity.length > 0 ? (
                    <div className="max-h-[360px] overflow-y-auto">
                      {recentActivity.map((item, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-4 gap-4 p-4 border-b border-purple-900/50 last:border-0 hover:bg-purple-900/10 cursor-pointer transition-colors duration-200"
                          onClick={() => handleShowTxDetails(item)}
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                          title={item.fullSignature || ""}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${
                                item.event === "Mint"
                                  ? "bg-green-500"
                                  : item.event === "Transfer"
                                  ? "bg-blue-500"
                                  : "bg-purple-500"
                              }`}
                            ></div>
                            <p className="text-white font-pixel">
                              {item.event}
                            </p>
                          </div>
                          <p className="text-purple-400 font-pixel truncate">
                            {item.item}
                          </p>
                          <p className="text-white font-pixel">
                            {item.price} SOL
                          </p>
                          <p className="text-gray-400 font-pixel">
                            {item.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-400 font-pixel">
                        No recent activities found.
                      </p>
                    </div>
                  )}
                </div>

                {/* Transaction Type Distribution */}
                {transactionTypeData.length > 0 && (
                  <div className="bg-black border border-purple-900/50 p-6 mb-8">
                    <h3 className="text-xl font-bold text-white mb-4 font-pixel">
                      TRANSACTION ACTIVITY
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="h-64 relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={transactionTypeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="#111"
                              strokeWidth={2}
                            >
                              {transactionTypeData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#000",
                                borderColor: "#a855f7",
                                fontFamily: "monospace",
                                fontSize: "12px",
                                color: "white",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="space-y-4">
                          {transactionTypeData.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center"
                            >
                              <div className="flex items-center">
                                <div
                                  className="w-4 h-4 mr-2"
                                  style={{
                                    backgroundColor:
                                      COLORS[index % COLORS.length],
                                  }}
                                ></div>
                                <span className="text-white font-pixel text-sm">
                                  {item.name}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-purple-400 font-pixel text-sm mr-2">
                                  {item.value}
                                </span>
                                <span className="text-gray-400 font-pixel text-sm">
                                  (
                                  {Math.round(
                                    (item.value /
                                      transactionTypeData.reduce(
                                        (sum, current) => sum + current.value,
                                        0
                                      )) *
                                      100
                                  )}
                                  %)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Enhanced Analytics Section */}
          <section className="relative py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <PixelHeading
                  text="PORTFOLIO ANALYTICS"
                  className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600"
                />

                {recentActivity.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Collection Distribution Chart */}
                    <div className="bg-black border border-purple-900/50 p-6">
                      <h3 className="text-xl font-bold text-white mb-4 font-pixel">
                        COLLECTION DISTRIBUTION
                      </h3>
                      <div className="h-64 relative">
                        {collectionDistribution.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={collectionDistribution}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) =>
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                                labelLine={false}
                              >
                                {collectionDistribution.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#000",
                                  borderColor: "#a855f7",
                                  fontFamily: "monospace",
                                  color: "white",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center">
                            <AbstractShape
                              className="w-16 h-16 text-purple-500/30 mb-4"
                              type="grid"
                            />
                            <p className="text-gray-400 font-pixel text-center">
                              No NFT data to display
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Portfolio Value Chart */}
                    <div className="bg-black border border-purple-900/50 p-6">
                      <h3 className="text-xl font-bold text-white mb-4 font-pixel">
                        PORTFOLIO VALUE OVER TIME
                      </h3>
                      <div className="h-64 relative">
                        {portfolioValueHistory.length > 1 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={portfolioValueHistory}
                              margin={{
                                top: 5,
                                right: 20,
                                left: 0,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#333"
                              />
                              <XAxis dataKey="date" stroke="#aaa" />
                              <YAxis stroke="#aaa" />
                              <Tooltip content={<CustomTooltip />} />
                              <defs>
                                <linearGradient
                                  id="colorValue"
                                  x1="0"
                                  y1="0"
                                  x2="1"
                                  y2="0"
                                >
                                  <stop offset="0%" stopColor="#a855f7" />
                                  <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                              </defs>
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="url(#colorValue)"
                                strokeWidth={3}
                                dot={{ fill: "#ec4899", strokeWidth: 2, r: 5 }}
                                activeDot={{ fill: "#fff", r: 7 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center">
                            <AbstractShape
                              className="w-16 h-16 text-purple-500/30 mb-4"
                              type="wave"
                            />
                            <p className="text-gray-400 font-pixel text-center">
                              Not enough transaction data to display chart
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black border border-purple-900/50 p-12 text-center">
                    <AbstractShape
                      className="w-24 h-24 mx-auto text-purple-500/30 mb-6"
                      type="grid"
                    />
                    <h3 className="text-2xl font-bold text-white mb-4 font-pixel">
                      NO ANALYTICS DATA
                    </h3>
                    <p className="text-gray-400 mb-6 font-pixel max-w-lg mx-auto">
                      You need at least one transaction to view portfolio
                      analytics. Try minting or buying an NFT.
                    </p>
                    <Button
                      asChild
                      className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 text-lg font-pixel tracking-wide"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      <Link href="/market">EXPLORE MARKETPLACE</Link>
                    </Button>
                  </div>
                )}

                {/* Additional Analytics - NFT Performance */}
                {ownedNFTs.length > 0 && (
                  <div className="mt-8 bg-black border border-purple-900/50 p-6">
                    <h3 className="text-xl font-bold text-white mb-6 font-pixel">
                      TOP NFT HOLDINGS
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-purple-900/50">
                            <th className="text-left p-3 text-gray-400 font-pixel">
                              NAME
                            </th>
                            <th className="text-left p-3 text-gray-400 font-pixel">
                              COLLECTION
                            </th>
                            <th className="text-left p-3 text-gray-400 font-pixel">
                              ACQUIRED
                            </th>
                            <th className="text-right p-3 text-gray-400 font-pixel">
                              VALUE
                            </th>
                            <th className="text-right p-3 text-gray-400 font-pixel">
                              CHANGE
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {ownedNFTs.slice(0, 5).map((nft, index) => (
                            <tr
                              key={index}
                              className="border-b border-purple-900/20 hover:bg-purple-900/5"
                            >
                              <td className="p-3 font-pixel text-white">
                                {nft.name}
                              </td>
                              <td className="p-3 font-pixel text-purple-400">
                                {nft.collection}
                              </td>
                              <td className="p-3 font-pixel text-gray-400">
                                {nft.acquired
                                  ? new Date(nft.acquired).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className="p-3 font-pixel text-right text-white">
                                {(
                                  nft.price || Math.random() * 10 + 0.1
                                ).toFixed(2)}{" "}
                                SOL
                              </td>
                              <td className="p-3 font-pixel text-right">
                                <span
                                  className={`${
                                    Math.random() > 0.5
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {Math.random() > 0.5 ? "+" : "-"}
                                  {(Math.random() * 25).toFixed(2)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Transaction Details Modal */}
          {showTxDetails && selectedTx && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black border-2 border-purple-500 p-8 max-w-2xl w-full"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white font-pixel">
                    TRANSACTION DETAILS
                  </h3>
                  <Button
                    onClick={handleCloseTxDetails}
                    className="bg-transparent border border-pink-500/50 hover:bg-pink-950/30 text-pink-400 rounded-none w-8 h-8 p-0 flex items-center justify-center"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <svg
                      width="14"
                      height="14"
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
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="border border-purple-900/50 p-4 bg-purple-950/10">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-gray-400 font-pixel">Event Type:</p>
                      <p className="text-white font-pixel col-span-2">
                        {selectedTx.event}
                      </p>
                    </div>
                  </div>

                  <div className="border border-purple-900/50 p-4">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-gray-400 font-pixel">Transaction:</p>
                      <div className="col-span-2 flex items-center">
                        <p
                          className="text-purple-400 font-pixel mr-2"
                          title={selectedTx.fullSignature || ""}
                        >
                          {selectedTx.fullSignature
                            ? `${selectedTx.fullSignature.substring(
                                0,
                                6
                              )}...${selectedTx.fullSignature.substring(
                                selectedTx.fullSignature.length - 6
                              )}`
                            : selectedTx.item}
                        </p>
                        <button
                          className="text-gray-400 hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Use fullSignature if available, otherwise process from item
                            let signatureToCopy;
                            if (selectedTx.fullSignature) {
                              signatureToCopy = selectedTx.fullSignature;
                            } else {
                              // Extract signature from item if it has format "Transaction xyz..."
                              const match =
                                selectedTx.item.match(/Transaction (.*)/);
                              signatureToCopy =
                                match && match[1] ? match[1] : selectedTx.item;
                            }

                            navigator.clipboard.writeText(signatureToCopy);
                            alert("Transaction signature copied to clipboard!");
                          }}
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                          aria-label="Copy transaction signature"
                          title="Copy transaction signature"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21H17C18.1046 21 19 20.1046 19 19V16M21 3H13V11H21V3Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border border-purple-900/50 p-4 bg-purple-950/10">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-gray-400 font-pixel">Amount:</p>
                      <p className="text-white font-pixel col-span-2">
                        {selectedTx.price} SOL
                      </p>
                    </div>
                  </div>

                  <div className="border border-purple-900/50 p-4">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-gray-400 font-pixel">Date:</p>
                      <p className="text-white font-pixel col-span-2">
                        {selectedTx.date}
                      </p>
                    </div>
                  </div>

                  <div className="border border-purple-900/50 p-4 bg-purple-950/10">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-gray-400 font-pixel">Status:</p>
                      <p className="text-green-400 font-pixel col-span-2">
                        CONFIRMED
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      // Use fullSignature if available, otherwise process from item
                      let signature;
                      if (selectedTx.fullSignature) {
                        signature = selectedTx.fullSignature;
                      } else {
                        // Extract signature from item if it has format "Transaction xyz..."
                        const match = selectedTx.item.match(/Transaction (.*)/);
                        signature =
                          match && match[1] ? match[1] : selectedTx.item;
                      }

                      console.log("Opening Solscan with signature:", signature);

                      // Ensure the correct path to Solscan with full transaction
                      const solscanUrl = `https://solscan.io/tx/${signature}${
                        process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet"
                          ? "?cluster=devnet"
                          : ""
                      }`;
                      console.log("Solscan URL:", solscanUrl);

                      window.open(solscanUrl, "_blank");
                    }}
                    className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    VIEW ON SOLSCAN
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {/* 3D Model Viewer Modal */}
          {showModelViewer && (
            <ModelViewer
              isOpen={showModelViewer}
              onClose={() => {
                setShowModelViewer(false);
                setCurrentModelUrl(null);
                setFallbackModelUrls([]);
                setCurrentNftForViewer(null);
              }}
              modelUrl={currentModelUrl}
              fallbackUrls={fallbackModelUrls}
              nft={currentNftForViewer}
            />
          )}

          {publicKey && (
            <ProfileEditModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              walletAddress={publicKey.toString()}
              currentUsername={
                auth.profile?.username ||
                userData?.displayName ||
                "VOID_COLLECTOR"
              }
              currentAvatarUrl={auth.profile?.avatar_url}
              onProfileUpdate={handleProfileUpdate}
            />
          )}

          <style jsx global>
            {cubeCssStyles}
          </style>

          {/* Footer */}
          <Footer />
        </>
      )}
    </div>
  );
}
