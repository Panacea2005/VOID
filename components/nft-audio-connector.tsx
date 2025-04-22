// components/nft-audio-connector.tsx
import React, { useEffect, useState } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { getNFTs } from "@/lib/services/walletService";
import { useAudio, AudioTrack } from '../app/game/contexts/audio-context';
import { motion, AnimatePresence } from "framer-motion";

// Define interface for music NFT
interface MusicNFT {
  id: string;
  name: string;
  audio_url?: string;
  audioUrl?: string;
  image?: string;
  artist?: string;
  duration?: number;
  mintedAt?: string;
  collection?: string;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
}

const NFTAudioConnector: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [musicNFTs, setMusicNFTs] = useState<MusicNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const audio = useAudio();

  // Function to extract audio URL from NFT
  const extractAudioUrl = (nft: MusicNFT): string | null => {
    console.log("Attempting to extract audio URL from NFT:", nft.name);
    
    // Direct audio URLs
    if (nft.audio_url) {
      console.log("Found direct audio_url:", nft.audio_url);
      return nft.audio_url;
    }
    
    if (nft.audioUrl) {
      console.log("Found direct audioUrl:", nft.audioUrl);
      return nft.audioUrl;
    }
    
    // Check properties.files for audio files
    if (nft.properties?.files?.length) {
      const audioFile = nft.properties.files.find(file => {
        const fileType = file.type?.toLowerCase() || '';
        const fileUri = file.uri?.toLowerCase() || '';
        return fileType.includes('audio') || 
               fileUri.endsWith('.mp3') || 
               fileUri.endsWith('.wav') ||
               fileUri.endsWith('.ogg');
      });
      
      if (audioFile?.uri) {
        console.log("Found audio in properties.files:", audioFile.uri);
        // Convert ipfs:// URLs to https URLs
        if (audioFile.uri.startsWith('ipfs://')) {
          const ipfsHash = audioFile.uri.replace('ipfs://', '');
          console.log("Converting IPFS URL to HTTPS:", `https://ipfs.io/ipfs/${ipfsHash}`);
          return `https://ipfs.io/ipfs/${ipfsHash}`;
        }
        return audioFile.uri;
      }
    }
    
    // Check attributes for "Audio URL" or similar
    if (nft.properties?.attributes?.length) {
      const audioAttr = nft.properties.attributes.find(attr => {
        const traitType = attr.trait_type?.toLowerCase() || '';
        return traitType.includes('audio') || traitType === 'audio url';
      });
      
      if (audioAttr?.value && typeof audioAttr.value === 'string' && audioAttr.value.includes('http')) {
        console.log("Found audio URL in attributes:", audioAttr.value);
        return audioAttr.value;
      }
    }
    
    console.log("No audio URL found for NFT:", nft.name);
    return null;
  };

  // Fetch NFTs when wallet connection changes
  useEffect(() => {
    if (!connected || !publicKey) {
      setMusicNFTs([]);
      
      // Remove any NFT tracks from audio context
      const allTracks = audio.getAvailableTracks();
      Object.keys(allTracks).forEach(trackId => {
        if (trackId.startsWith('nft-')) {
          audio.removeTrack(trackId);
        }
      });
    }
  }, [connected, publicKey]);

  // Fetch music NFTs from wallet
  const fetchWalletMusicNFTs = async () => {
    if (!publicKey) {
      setError("Please connect your wallet to import NFT music");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setShowResults(true);
      console.log("Fetching music NFTs from wallet...");

      // Get all NFTs from wallet
      const nftData = await getNFTs(publicKey);
      
      // Filter for music NFTs
      const musicNFTs = nftData.ownedNFTs.filter(nft => {
        // Check if it's explicitly marked as music type
        if (nft.type === "music") return true;
        
        // Check if it has audio_url or audioUrl
        if (nft.audioUrl || nft.audioUrl) return true;
        
        // Check properties.files for audio file types
        if (nft.properties?.files?.some((file: { type: string; uri: string; }) => {
          const fileType = file.type?.toLowerCase() || '';
          const fileUri = file.uri?.toLowerCase() || '';
          return fileType.includes('audio') || 
                 fileUri.endsWith('.mp3') || 
                 fileUri.endsWith('.wav') ||
                 fileUri.endsWith('.ogg');
        })) return true;
        
        // Check attributes for Audio URL or similar
        if (nft.properties?.attributes?.some((attr: { trait_type: string; value: string; }) => {
          const traitType = attr.trait_type?.toLowerCase() || '';
          const value = attr.value?.toLowerCase() || '';
          return (traitType.includes('audio') && value.includes('http')) ||
                 traitType === 'audio url';
        })) return true;
        
        return false;
      });

      console.log(`Found ${musicNFTs.length} music NFTs in wallet`);
      setMusicNFTs(musicNFTs);
      
      // Add NFTs to audio context
      addNFTsToAudioContext(musicNFTs);
    } catch (error) {
      console.error("Error fetching wallet music NFTs:", error);
      setError("Failed to load music NFTs from wallet");
    } finally {
      setIsLoading(false);
    }
  };

  // Add NFTs to audio context
  const addNFTsToAudioContext = (nfts: MusicNFT[]) => {
    console.log("Adding NFTs to audio context...");
    
    // First, remove any existing NFT tracks
    const allTracks = audio.getAvailableTracks();
    Object.keys(allTracks).forEach(trackId => {
      if (trackId.startsWith('nft-')) {
        audio.removeTrack(trackId);
      }
    });
    
    // Add new NFT tracks
    let validTracksCount = 0;
    
    nfts.forEach((nft, index) => {
      const audioUrl = extractAudioUrl(nft);
      if (!audioUrl) return;
      
      // Create a unique ID for this NFT track
      const trackId = `nft-${nft.id || index}`;
      
      // Extract additional metadata
      const artist = nft.artist || "VOID NFT";
      const duration = nft.duration || 180; // Default 3 minutes
      
      // Create track object
      const track: AudioTrack = {
        path: audioUrl,
        title: nft.name || `NFT Music #${index + 1}`,
        artist: artist,
        duration: duration,
        cover: nft.image || "/images/default-cover.jpg",
        isNft: true,
        nftData: nft
      };
      
      // Add to audio context
      console.log(`Adding NFT track to audio context: ${trackId}`);
      audio.addTrack(trackId, track);
      validTracksCount++;
    });
    
    if (validTracksCount === 0) {
      setError("No playable music NFTs found in your wallet");
    } else {
      setError(null);
    }
  };

  return (
    <div className="mt-2">
      <button 
        onClick={fetchWalletMusicNFTs}
        disabled={isLoading || !connected}
        className={`w-full py-2 text-sm ${
          connected
            ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/50'
            : 'bg-gray-800/50 text-gray-500 border border-gray-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-pink-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading NFTs...
          </div>
        ) : connected ? (
          'Import Music NFTs from Wallet'
        ) : (
          'Connect Wallet to Import Music NFTs'
        )}
      </button>
      
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2"
          >
            {error ? (
              <div className="text-sm text-red-400 p-2">{error}</div>
            ) : (
              <div className="text-sm text-green-400 p-2">
                {musicNFTs.length} music NFTs imported successfully!
              </div>
            )}
            
            <div className="flex justify-end mt-2">
              <button 
                onClick={() => setShowResults(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NFTAudioConnector;