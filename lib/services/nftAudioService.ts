// lib/services/nftAudioService.ts - Fixed version

import { PublicKey } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";

function getAlternativeIpfsUrls(ipfsUri: string): string[] {
  // Extract the IPFS hash
  let ipfsHash = ipfsUri;

  // Handle ipfs:// protocol
  if (ipfsUri.startsWith("ipfs://")) {
    ipfsHash = ipfsUri.replace("ipfs://", "");
  }
  // Handle https://ipfs.io/ipfs/ style URLs
  else if (ipfsUri.includes("/ipfs/")) {
    ipfsHash = ipfsUri.split("/ipfs/")[1];
  }

  // Clean any query parameters or trailing slashes
  ipfsHash = ipfsHash.split("?")[0].split("#")[0].replace(/\/$/, "");

  // Generate alternative gateway URLs
  return [
    `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
    `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    `https://ipfs.io/ipfs/${ipfsHash}`,
    `https://dweb.link/ipfs/${ipfsHash}`,
    `https://ipfs.filebase.io/ipfs/${ipfsHash}`,
    `https://gateway.ipfs.io/ipfs/${ipfsHash}`,
    `https://nftstorage.link/ipfs/${ipfsHash}`,
    `https://w3s.link/ipfs/${ipfsHash}`,
    `https://ipfs.cf-ipfs.com/ipfs/${ipfsHash}`,
  ];
}

/**
 * Extracts audio URL from NFT metadata with comprehensive detection
 * @param nft The NFT metadata object
 * @returns Audio URL if found, null otherwise
 */
export function extractAudioUrl(nft: any): string | null {
  console.log(`Analyzing NFT for audio URL: ${nft.name || "Unknown NFT"}`);

  // Special case for erweima.ai API Box NFTs
  if (
    nft.animation_url?.includes("apiboxfiles.erweima.ai") ||
    nft.audio?.includes("apiboxfiles.erweima.ai")
  ) {
    console.log(`Found API Box audio URL:`, nft.animation_url || nft.audio);
    return nft.animation_url || nft.audio;
  }

  // Special case for VOID Music NFTs
  if (nft.name?.includes("VOID Music")) {
    // Check properties.files for audio files - common pattern
    if (nft.properties?.files?.length) {
      const audioFile = nft.properties.files.find((file: any) => {
        if (!file) return false;
        if (
          typeof file.type === "string" &&
          file.type.toLowerCase().includes("audio")
        )
          return true;
        if (
          typeof file.uri === "string" &&
          (file.uri.endsWith(".mp3") ||
            file.uri.endsWith(".wav") ||
            file.uri.endsWith(".ogg") ||
            file.uri.includes("apiboxfiles.erweima.ai"))
        )
          return true;
        return false;
      });

      if (audioFile) {
        console.log("Found audio file in properties.files:", audioFile.uri);
        return audioFile.uri;
      }
    }
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
      return nft[field];
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
      return nft.animation_url;
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
        return audioFile;
      } else if (audioFile.uri) {
        console.log("Found audio object in files array:", audioFile.uri);
        return audioFile.uri;
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
        return audioFile;
      } else if (audioFile.uri) {
        console.log("Found audio object in files array:", audioFile.uri);
        return audioFile.uri;
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
        return audioAttr.value;
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
      return audioUrlMatches[0];
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

        // Fetch metadata
        console.log(`Attempting to fetch metadata from: ${nft.uri}`);
        let response;
        let responseOk = false;

        // Try primary URL first
        try {
          response = await fetch(nft.uri);
          responseOk = response.ok;
        } catch (fetchError) {
          console.warn(
            `Error fetching from primary URL: ${nft.uri}`,
            fetchError
          );
        }

        // If primary URL fails and it's IPFS, try alternatives
        if (
          !responseOk &&
          (nft.uri.includes("ipfs") || nft.uri.includes("/ipfs/"))
        ) {
          console.log(
            `Primary IPFS URL failed, trying alternative gateways for: ${nft.uri}`
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
        if (imageUrl.startsWith("ipfs://")) {
          const ipfsHash = imageUrl.replace("ipfs://", "");
          imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        }

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

    console.log(`Found ${audioNFTs.length} NFTs with audio content`);
    return audioNFTs;
  } catch (error) {
    console.error("Error fetching NFT audio tracks:", error);
    return [];
  }
}
