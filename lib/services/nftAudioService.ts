// lib/services/nftAudioService.ts - Fixed version

import { PublicKey } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";

function getAlternativeIpfsUrls(uri: string): string[] {
  let hash = uri;
  
  // Extract hash from ipfs:// format
  if (uri.startsWith('ipfs://')) {
    hash = uri.replace('ipfs://', '');
  }
  // Extract hash from HTTP URL format
  else if (uri.includes('/ipfs/')) {
    hash = uri.split('/ipfs/')[1];
  }
  
  // Clean up hash (remove any query parameters or trailing slashes)
  hash = hash.split('?')[0].split('#')[0].replace(/\/$/, '');
  
  // Return multiple gateway URLs for this hash
  return [
    `https://ipfs.io/ipfs/${hash}`,
    `https://gateway.pinata.cloud/ipfs/${hash}`,
    `https://cloudflare-ipfs.com/ipfs/${hash}`,
    `https://dweb.link/ipfs/${hash}`,
    `https://ipfs.filebase.io/ipfs/${hash}`,
    `https://nftstorage.link/ipfs/${hash}`,
    `https://w3s.link/ipfs/${hash}`,
    `https://ipfs.cf-ipfs.com/ipfs/${hash}`,
  ];
}

// Convert IPFS URI to HTTP URL for browser compatibility
function convertIpfsUriToHttpUrl(uri: string): string {
  if (!uri) return uri;
  
  // Already HTTP format, no conversion needed
  if (uri.startsWith('http')) return uri;
  
  // Handle ipfs:// protocol
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${hash}`;
  }
  
  // Handle /ipfs/ paths
  if (uri.includes('/ipfs/')) {
    const hash = uri.split('/ipfs/')[1];
    return `https://ipfs.io/ipfs/${hash}`;
  }
  
  return uri; // Return original if not an IPFS URI
}

/**
 * Extracts audio URL from NFT metadata with comprehensive detection
 * @param nft The NFT metadata object
 * @returns Audio URL if found, null otherwise
 */
/**
 * Extracts audio URL from NFT metadata with comprehensive detection and IPFS conversion
 * @param nft The NFT metadata object
 * @returns Audio URL if found, null otherwise
 */
export function extractAudioUrl(nft: any): string | null {
  console.log(`Analyzing NFT for audio URL: ${nft.name || "Unknown NFT"}`);

  // Special case for VOID Music NFTs with specific debugging
  if (nft.name?.includes("VOID Music")) {
    console.log("Found a VOID Music NFT! Analyzing in detail:", nft.name);

    // CRITICAL FIX: Try to extract audioUrl directly from the NFT object
    // This is how it's stored when minted in your application
    if (nft.audioUrl && typeof nft.audioUrl === "string") {
      console.log("Found direct audioUrl in VOID Music NFT:", nft.audioUrl);
      return convertIpfsUriToHttpUrl(nft.audioUrl);
    }

    // Check for audio_url in properties (common in your mintNFT function)
    if (nft.properties?.audio_url && typeof nft.properties.audio_url === "string") {
      console.log("Found audio_url in properties:", nft.properties.audio_url);
      return convertIpfsUriToHttpUrl(nft.properties.audio_url);
    }

    // Check for animation_url which is commonly used for music NFTs
    if (nft.animation_url && typeof nft.animation_url === "string") {
      console.log("Found animation_url in VOID Music NFT:", nft.animation_url);
      return convertIpfsUriToHttpUrl(nft.animation_url);
    }

    // Check properties.files for audio files - common pattern in VOID Music NFTs
    if (nft.properties?.files?.length) {
      console.log("Checking VOID Music NFT files array with length:", nft.properties.files.length);
      
      // Print all files for debugging
      nft.properties.files.forEach((file: any, index: number) => {
        console.log(`File ${index}:`, JSON.stringify(file));
      });
      
      const audioFile = nft.properties.files.find((file: any) => {
        if (!file) return false;
        
        // Check type field
        if (typeof file.type === "string" && 
            (file.type.toLowerCase().includes("audio") || 
             file.type.toLowerCase().includes("mp3") || 
             file.type.toLowerCase().includes("mpeg"))) {
          return true;
        }
        
        // Check URI field
        if (typeof file.uri === "string") {
          const uri = file.uri.toLowerCase();
          if (uri.endsWith(".mp3") || 
              uri.endsWith(".wav") || 
              uri.endsWith(".ogg") ||
              uri.includes("/audio/") ||
              uri.includes("music") ||
              uri.includes("sound")) {
            return true;
          }
        }
        
        return false;
      });

      if (audioFile) {
        if (typeof audioFile === "string") {
          console.log("Found audio string in files array:", audioFile);
          return convertIpfsUriToHttpUrl(audioFile);
        } else if (audioFile.uri) {
          console.log("Found audio object in files array:", audioFile.uri);
          return convertIpfsUriToHttpUrl(audioFile.uri);
        }
      }
    }

    // Log the entire NFT metadata for debugging
    console.log("VOID Music NFT full metadata dump for debugging:");
    Object.keys(nft).forEach(key => {
      console.log(`NFT.${key}:`, typeof nft[key] === 'object' ? 
                 JSON.stringify(nft[key]).substring(0, 100) + '...' : nft[key]);
    });
  }

  // Continue with standard extraction for non-VOID Music NFTs
  
  // Special case for erweima.ai API Box NFTs
  if (
    nft.animation_url?.includes("apiboxfiles.erweima.ai") ||
    nft.audio?.includes("apiboxfiles.erweima.ai")
  ) {
    console.log(`Found API Box audio URL:`, nft.animation_url || nft.audio);
    return nft.animation_url || nft.audio;
  }

  // 1. Check direct audio URL fields (common patterns)
  const directAudioFields = [
    "audio_url",
    "audioUrl",
    "audio",
    "music_url",
    "mp3Url",
    "wavUrl",
    "audio_link",
    "music_link",
    "sound_url",
    "track_url",
  ];

  for (const field of directAudioFields) {
    if (nft[field] && typeof nft[field] === "string") {
      console.log(`Found direct audio URL in ${field}:`, nft[field]);
      return convertIpfsUriToHttpUrl(nft[field]);
    }
  }

  // 2. Check for animation_url field that might contain audio
  if (nft.animation_url && typeof nft.animation_url === "string") {
    const url = nft.animation_url.toLowerCase();
    if (
      url.endsWith(".mp3") ||
      url.endsWith(".wav") ||
      url.endsWith(".ogg") ||
      url.endsWith(".m4a") ||
      url.endsWith(".aac") ||
      url.includes("/audio/")
    ) {
      console.log(`Found audio URL in animation_url:`, nft.animation_url);
      return convertIpfsUriToHttpUrl(nft.animation_url);
    }
  }

  // 3. Check properties.files for audio files
  if (nft.properties?.files?.length) {
    console.log("Checking NFT properties.files array");
    const audioFile = nft.properties.files.find((file: any) => {
      if (!file) return false;

      const fileType =
        typeof file.type === "string" ? file.type.toLowerCase() : "";
      const fileUri =
        typeof file.uri === "string"
          ? file.uri.toLowerCase()
          : typeof file === "string"
          ? file.toLowerCase()
          : "";

      // Check if file has audio mime type
      if (
        fileType.includes("audio") ||
        fileType.includes("mp3") ||
        fileType.includes("wav") ||
        fileType.includes("ogg")
      ) {
        return true;
      }

      // Check file extension
      if (
        fileUri.endsWith(".mp3") ||
        fileUri.endsWith(".wav") ||
        fileUri.endsWith(".ogg") ||
        fileUri.endsWith(".flac") ||
        fileUri.endsWith(".m4a")
      ) {
        return true;
      }

      return false;
    });

    if (audioFile) {
      if (typeof audioFile === "string") {
        console.log("Found audio string in files array:", audioFile);
        return convertIpfsUriToHttpUrl(audioFile);
      } else if (audioFile.uri) {
        console.log("Found audio object in files array:", audioFile.uri);
        return convertIpfsUriToHttpUrl(audioFile.uri);
      }
    }
  }

  // 4. Check for direct files array at top level
  if (Array.isArray(nft.files)) {
    console.log("Checking NFT files array at top level");
    const audioFile = nft.files.find((file: any) => {
      if (!file) return false;

      const fileType =
        typeof file.type === "string" ? file.type.toLowerCase() : "";
      const fileUri =
        typeof file.uri === "string"
          ? file.uri.toLowerCase()
          : typeof file === "string"
          ? file.toLowerCase()
          : "";

      return (
        fileType.includes("audio") ||
        fileUri.endsWith(".mp3") ||
        fileUri.endsWith(".wav") ||
        fileUri.endsWith(".ogg")
      );
    });

    if (audioFile) {
      if (typeof audioFile === "string") {
        console.log("Found audio string in files array:", audioFile);
        return convertIpfsUriToHttpUrl(audioFile);
      } else if (audioFile.uri) {
        console.log("Found audio object in files array:", audioFile.uri);
        return convertIpfsUriToHttpUrl(audioFile.uri);
      }
    }
  }

  // 5. Check for attributes with audio URL
  const attributeContainers = [nft.attributes, nft.properties?.attributes];
  for (const container of attributeContainers) {
    if (Array.isArray(container)) {
      const audioAttr = container.find((attr: any) => {
        if (!attr || !attr.trait_type) return false;
        const traitType = attr.trait_type.toLowerCase();
        return (
          traitType.includes("audio") ||
          traitType === "audio url" ||
          traitType === "music url" ||
          traitType === "sound" ||
          traitType === "track"
        );
      });

      if (audioAttr?.value && typeof audioAttr.value === "string") {
        console.log(`Found audio URL in attributes:`, audioAttr.value);
        return convertIpfsUriToHttpUrl(audioAttr.value);
      }
    }
  }

  // 6. Look for audio URL patterns in description as a fallback
  if (typeof nft.description === "string") {
    const audioUrlMatches = nft.description.match(
      /(https?:\/\/[^\s]+\.(mp3|wav|ogg|m4a))/gi
    );
    if (audioUrlMatches && audioUrlMatches.length > 0) {
      console.log("Found audio URL in description:", audioUrlMatches[0]);
      return audioUrlMatches[0]; // Already HTTP
    }
    
    // Also check for IPFS URLs in description
    const ipfsUrlMatches = nft.description.match(
      /(ipfs:\/\/[^\s]+)/gi
    );
    if (ipfsUrlMatches && ipfsUrlMatches.length > 0) {
      console.log("Found IPFS URL in description:", ipfsUrlMatches[0]);
      return convertIpfsUriToHttpUrl(ipfsUrlMatches[0]);
    }
  }

  // If this is a VOID Music NFT but we couldn't find the URL, log details
  if (nft.name?.includes("VOID Music")) {
    console.warn("Failed to find audio URL for VOID Music NFT:", nft.name);
    console.log("NFT metadata:", JSON.stringify(nft, null, 2));
  }

  console.log("No audio URL found for NFT:", nft.name || "Unknown NFT");
  return null;
}

/**
 * Fetches NFT audio tracks from the user's wallet with comprehensive detection
 * @param walletAddress The user's wallet public key
 * @returns Array of audio NFTs with their properties
 */
export async function fetchNFTAudioTracks(
  walletAddress: PublicKey
): Promise<any[]> {
  try {
    console.log(
      `Fetching NFT audio tracks for wallet: ${walletAddress.toString()}`
    );

    // Use the same RPC endpoint as your profile page
    const endpoint =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
    console.log(`Using RPC endpoint: ${endpoint}`);

    const connection = new Connection(endpoint, "confirmed");
    const metaplex = new Metaplex(connection);

    // Fetch all NFTs owned by this wallet
    console.log("Fetching NFTs from blockchain...");
    const nfts = await metaplex.nfts().findAllByOwner({ owner: walletAddress });
    console.log(`Found ${nfts.length} total NFTs in wallet`);

    // Array to store the audio NFTs
    const audioNFTs = [];

    // Process each NFT to extract audio data
    for (const nft of nfts) {
      try {
        // Skip NFTs without metadata URI
        if (!nft.uri) {
          console.log(
            `NFT ${
              nft.name || nft.address.toString()
            } has no metadata URI, skipping`
          );
          continue;
        }

        // CRITICAL FIX: Convert IPFS URI to HTTP URL before fetching
        const metadataUrl = convertIpfsUriToHttpUrl(nft.uri);
        console.log(`Attempting to fetch metadata from: ${metadataUrl} (original: ${nft.uri})`);
        
        let response;
        let responseOk = false;

        // Try primary URL first
        try {
          response = await fetch(metadataUrl);
          responseOk = response.ok;
        } catch (fetchError) {
          console.warn(
            `Error fetching from primary URL: ${metadataUrl}`,
            fetchError
          );
        }

        // If primary URL fails, try alternatives
        if (!responseOk) {
          console.log(
            `Primary URL failed, trying alternative gateways for: ${nft.uri}`
          );
          const alternativeUrls = getAlternativeIpfsUrls(nft.uri);

          // Try each alternative URL until one works
          for (const url of alternativeUrls) {
            try {
              console.log(`Trying alternative IPFS gateway: ${url}`);
              response = await fetch(url);
              if (response.ok) {
                console.log(
                  `Successfully fetched metadata from alternative gateway: ${url}`
                );
                responseOk = true;
                break;
              }
            } catch (altFetchError) {
              console.warn(`Alternative gateway failed: ${url}`, altFetchError);
            }
          }
        }

        // If all fetches failed, skip this NFT
        if (!responseOk) {
          console.log(
            `Failed to fetch metadata for ${
              nft.name || nft.address.toString()
            } from any source`
          );
          continue;
        }

        if (!response) {
          console.log(
            `No valid response for ${
              nft.name || nft.address.toString()
            }, skipping`
          );
          continue;
        }
        
        // Parse the metadata JSON
        const metadata = await response.json();
        console.log(
          `Got metadata for ${metadata.name || nft.name || "Unknown NFT"}`
        );

        // Special handling for VOID Music NFTs
        if (metadata.name?.includes("VOID Music")) {
          console.log("Found a VOID Music NFT:", metadata.name);
          console.log("Full metadata:", JSON.stringify(metadata, null, 2));
        }

        // Combine NFT and metadata for more complete data
        const combinedNFT = {
          ...nft,
          ...metadata,
          id: nft.address.toString(),
          mint: nft.address.toString(),
        };

        // Look for audio URL
        const audioUrl = extractAudioUrl(combinedNFT);

        // Skip NFTs with no audio URL
        if (!audioUrl) {
          continue;
        }

        // Get artist name from various possible locations
        const artist =
          metadata.artist ||
          metadata.properties?.artist ||
          metadata.attributes?.find(
            (attr: any) => attr.trait_type?.toLowerCase() === "artist"
          )?.value ||
          "VOID";

        // Get or estimate duration
        const duration =
          metadata.duration ||
          metadata.properties?.duration ||
          metadata.attributes?.find(
            (attr: any) => attr.trait_type?.toLowerCase() === "duration"
          )?.value ||
          180; // Default to 3 minutes if no duration specified

        // Get image URL
        let imageUrl = metadata.image || "";

        // Convert IPFS URL to HTTP URL if needed
        imageUrl = convertIpfsUriToHttpUrl(imageUrl);

        // Use a fallback image if no image is available
        if (!imageUrl) {
          imageUrl = "/void-cover.jpg";
        }

        // Create the NFT audio track object
        audioNFTs.push({
          id: nft.address.toString(),
          name:
            metadata.name ||
            nft.name ||
            `Track #${nft.address.toString().slice(0, 6)}`,
          description: metadata.description || "",
          image: imageUrl,
          extractedAudioUrl: audioUrl,
          artist: artist,
          duration: parseInt(duration.toString()),
          // Original data for reference
          nft: nft,
          metadata: metadata,
        });

        console.log(
          `Added audio NFT: ${metadata.name || nft.name} with URL: ${audioUrl}`
        );
      } catch (error) {
        console.error(`Error processing NFT:`, error);
      }
    }

    console.log(`Found total of ${audioNFTs.length} NFTs with audio content`);
    return audioNFTs;
  } catch (error) {
    console.error("Error fetching NFT audio tracks:", error);
    return [];
  }
}