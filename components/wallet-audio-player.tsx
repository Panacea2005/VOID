// components/wallet-audio-player.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { getNFTs } from "@/lib/services/walletService";
import { useAudio } from '../app/game/contexts/audio-context';

// Define type for Music NFTs
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

const WalletAudioPlayer: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [musicNFTs, setMusicNFTs] = useState<MusicNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audio = useAudio();

  // Fetch NFTs when wallet connection changes
  useEffect(() => {
    if (connected && publicKey) {
      fetchWalletMusicNFTs();
    } else {
      setMusicNFTs([]);
    }
  }, [connected, publicKey]);

  // Extract audio URLs from NFTs and load them into audio context
  useEffect(() => {
    if (musicNFTs.length > 0) {
      // Load NFT tracks into audio context
      loadNFTTracksIntoAudioContext();
    }
  }, [musicNFTs]);

  // Fetch music NFTs from wallet
  const fetchWalletMusicNFTs = async () => {
    if (!publicKey) return;

    try {
      setIsLoading(true);
      setError(null);
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
    } catch (error) {
      console.error("Error fetching wallet music NFTs:", error);
      setError("Failed to load music NFTs from wallet");
    } finally {
      setIsLoading(false);
    }
  };

  // Extract audio URL from NFT
  const extractAudioUrl = (nft: MusicNFT): string | null => {
    // Direct audio URLs
    if (nft.audio_url) return nft.audio_url;
    if (nft.audioUrl) return nft.audioUrl;
    
    // Check in properties.files for audio files
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
        // Convert ipfs:// URLs to https URLs
        if (audioFile.uri.startsWith('ipfs://')) {
          const ipfsHash = audioFile.uri.replace('ipfs://', '');
          return `https://ipfs.io/ipfs/${ipfsHash}`;
        }
        return audioFile.uri;
      }
    }
    
    // Check in attributes
    if (nft.properties?.attributes?.length) {
      const audioAttr = nft.properties.attributes.find(attr => {
        const traitType = attr.trait_type?.toLowerCase() || '';
        return traitType.includes('audio') || traitType === 'audio url';
      });
      
      if (audioAttr?.value && typeof audioAttr.value === 'string' && audioAttr.value.includes('http')) {
        return audioAttr.value;
      }
    }
    
    return null;
  };

  // Load NFT tracks into audio context
  const loadNFTTracksIntoAudioContext = () => {
    // We'll create a custom ID for each NFT track prefixed with 'nft-'
    // to distinguish them from default tracks
    const nftAudioTracks: Record<string, any> = {};
    
    musicNFTs.forEach((nft, index) => {
      const audioUrl = extractAudioUrl(nft);
      if (!audioUrl) return;

      // Create a unique ID for this NFT track
      const trackId = `nft-${nft.id || index}`;
      
      // Create track data
      nftAudioTracks[trackId] = {
        path: audioUrl,
        title: nft.name || `NFT Music #${index + 1}`,
        artist: nft.artist || "VOID NFT",
        duration: nft.duration || 180, // Default 3 minutes if unknown
        cover: nft.image || "/images/default-cover.jpg",
        isNft: true,
        nftData: nft
      };
    });

    // Add these tracks to the audio context
    // This likely requires updating the audioTracks in audio-context.tsx
    // or implementing a method to add tracks dynamically
    
    console.log("NFT audio tracks to add:", nftAudioTracks);
    
    // For now, we'll just log these tracks
    // In the next step, we'll integrate with audio-context
  };

  // Play an NFT track
  const playNFTTrack = (nftId: string) => {
    // Check if this NFT exists in our loaded tracks
    const trackId = `nft-${nftId}`;
    audio.changeTrack(trackId);
  };

  if (isLoading) {
    return <div className="text-sm text-gray-400">Loading wallet audio...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-400">{error}</div>;
  }

  return (
    <div className="mt-4">
      {musicNFTs.length > 0 ? (
        <div>
          <h3 className="text-white font-bold mb-2 text-sm">Your Music NFTs</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {musicNFTs.map((nft, index) => {
              const audioUrl = extractAudioUrl(nft);
              if (!audioUrl) return null;
              
              return (
                <button
                  key={nft.id || index}
                  className="flex items-center w-full p-2 rounded hover:bg-purple-900/20"
                  onClick={() => playNFTTrack(nft.id || index.toString())}
                >
                  <div className="w-8 h-8 bg-black rounded overflow-hidden mr-2 flex-shrink-0">
                    <img 
                      src={nft.image || "/images/default-cover.jpg"} 
                      alt={nft.name || "NFT Music"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/images/default-cover.jpg";
                      }}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm text-white truncate">{nft.name || `NFT Music #${index + 1}`}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {nft.artist || "VOID NFT"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : connected ? (
        <div className="text-sm text-gray-400">No music NFTs found in your wallet</div>
      ) : (
        <div className="text-sm text-gray-400">Connect wallet to see your music NFTs</div>
      )}
    </div>
  );
};

export default WalletAudioPlayer;