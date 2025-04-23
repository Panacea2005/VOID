import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchNFTAudioTracks } from "@/lib/services/nftAudioService";

// Define audio track type
export interface AudioTrack {
  path: string;
  title: string;
  artist: string;
  duration: number;
  cover: string;
  isNft?: boolean;
  nftData?: any;
}

// Define base audio tracks
export const DEFAULT_AUDIO_TRACKS: Record<string, AudioTrack> = {
  hub: {
    path: "/audio/hub-theme.mp3",
    title: "Void",
    artist: "VOID",
    duration: 220,
    cover: "/void-cover.jpg",
  },
  echo: {
    path: "/audio/echo-theme.mp3",
    title: "Echo",
    artist: "VOID",
    duration: 180,
    cover: "/echo-cover.jpg",
  },
  nexus: {
    path: "/audio/nexus-theme.mp3",
    title: "Nexus",
    artist: "VOID",
    duration: 195,
    cover: "/nexus-cover.jpg",
  },
  abyss: {
    path: "/audio/abyss-theme.mp3",
    title: "Abyss",
    artist: "VOID",
    duration: 210,
    cover: "/abyss-cover.jpg",
  },
  pulse: {
    path: "/audio/pulse-theme.mp3",
    title: "Pulse",
    artist: "VOID",
    duration: 185,
    cover: "/pulse-cover.jpg",
  },
  cipher: {
    path: "/audio/cipher-theme.mp3",
    title: "Cipher",
    artist: "VOID",
    duration: 190,
    cover: "/cipher-cover.jpg",
  },
  cryptic: {
    path: "/audio/cryptic-theme.mp3",
    title: "Cryptic",
    artist: "VOID",
    duration: 200,
    cover: "/cryptic-cover.jpg",
  },
  vortex: {
    path: "/audio/vortex-theme.mp3",
    title: "Vortex",
    artist: "VOID",
    duration: 190,
    cover: "/vortex-cover.jpg",
  },
  enigma: {
    path: "/audio/enigma-theme.mp3",
    title: "Enigma",
    artist: "VOID",
    duration: 190,
    cover: "/enigma-cover.jpg"
  }
};

// Format time in MM:SS
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Define the enhanced audio context type
type AudioContextType = {
  isPlaying: boolean;
  currentTrackId: string;
  volume: number;
  progress: number;
  togglePlayback: () => void;
  toggleMute: () => void;
  changeTrack: (trackId: string) => void;
  skipToPrevious: () => void;
  skipToNext: () => void;
  setVolume: (volume: number) => void;
  seekTo: (progress: number) => void;
  playSound: (trackId: string) => void;
  addTrack: (trackId: string, trackData: AudioTrack) => void;
  removeTrack: (trackId: string) => void;
  getAvailableTracks: () => Record<string, AudioTrack>;
  getCurrentTrack: () => AudioTrack | undefined;
  audioTracks: Record<string, AudioTrack>;
  isNftTrack: (trackId: string) => boolean;
  isLoadingNfts: boolean;
  refreshNftTracks: () => Promise<void>;
};

// Create the context
const AudioContext = createContext<AudioContextType | null>(null);

// Provider component
export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false); // Changed to start as false to prevent auto-play before user interaction
  const [currentTrackId, setCurrentTrackId] = useState("hub");
  const [volume, setCurrentVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);

  // Use wallet connection
  const { publicKey, connected } = useWallet();

  // Track storage - now uses state to allow dynamic updates
  const [audioTracks, setAudioTracks] =
    useState<Record<string, AudioTrack>>(DEFAULT_AUDIO_TRACKS);

  // Previous state for mute toggle
  const previousVolumeRef = useRef(0.7);

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Progress interval ref
  const progressIntervalRef = useRef<number | null>(null);

  // Fade transition refs
  const fadeIntervalRef = useRef<number | null>(null);

  // Flag to track if fade operation is in progress
  const isFadingRef = useRef<boolean>(false);

  // Error tracking for tracks that fail to load
  const failedTracksRef = useRef<Set<string>>(new Set());

  // Get current track info
  const getCurrentTrack = (): AudioTrack | undefined => {
    return audioTracks[currentTrackId];
  };

  // Check if current track is an NFT
  const isNftTrack = (trackId: string): boolean => {
    return !!audioTracks[trackId]?.isNft;
  };

  // Add a new track dynamically (for NFTs)
  const addTrack = (trackId: string, trackData: AudioTrack) => {
    console.log(`AudioProvider - Adding new track: ${trackId}`, trackData);

    setAudioTracks((prevTracks) => ({
      ...prevTracks,
      [trackId]: trackData,
    }));
  };

  // Remove a track
  const removeTrack = (trackId: string) => {
    console.log(`AudioProvider - Removing track: ${trackId}`);

    setAudioTracks((prevTracks) => {
      const newTracks = { ...prevTracks };
      // Don't allow removing default tracks
      if (!trackId.startsWith("nft-") && DEFAULT_AUDIO_TRACKS[trackId]) {
        console.warn(`Cannot remove default track: ${trackId}`);
        return prevTracks;
      }

      delete newTracks[trackId];
      return newTracks;
    });

    // If the current track is being removed, switch to hub
    if (currentTrackId === trackId) {
      changeTrack("hub");
    }
  };

  // Get all available tracks
  const getAvailableTracks = (): Record<string, AudioTrack> => {
    return audioTracks;
  };

  // Automatically fetch NFT tracks when wallet connects
  useEffect(() => {
    let timeoutId: number | null = null;

    if (connected && publicKey) {
      console.log("AudioContext - Wallet connected, fetching NFT tracks...");

      // Add a slight delay to ensure wallet connection is fully established
      timeoutId = window.setTimeout(() => {
        refreshNftTracks().catch((error) => {
          console.error("Failed to refresh NFT tracks:", error);
        });
      }, 1500);
    } else {
      console.log("AudioContext - Wallet disconnected, removing NFT tracks");

      // Remove NFT tracks when wallet disconnects
      setAudioTracks((prevTracks) => {
        const newTracks = { ...prevTracks };
        let removedCount = 0;

        Object.keys(newTracks).forEach((trackId) => {
          if (trackId.startsWith("nft-")) {
            delete newTracks[trackId];
            removedCount++;
          }
        });

        console.log(`Removed ${removedCount} NFT tracks after disconnect`);
        return newTracks;
      });

      // If current track was an NFT, switch to hub
      if (currentTrackId.startsWith("nft-")) {
        changeTrack("hub");
      }
    }

    // Clean up timeout if component unmounts
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [connected, publicKey]);

  // Function to test if audio URL is valid and can be played
  const testAudioUrl = async (url: string): Promise<boolean> => {
    try {
      console.log(`Testing audio URL: ${url}`);

      // Skip validation for known working domains to avoid CORS issues
      if (
        url.includes("apiboxfiles.erweima.ai") ||
        url.includes("ipfs") ||
        url.includes("arweave") ||
        url.includes("ar-io") ||
        url.includes("void-resonance")
      ) {
        console.log(
          `Trusted domain detected for ${url}, skipping validation tests`
        );
        return true;
      }

      // For other URLs, try a direct audio element test
      return new Promise((resolve) => {
        console.log(`Creating test audio element for: ${url}`);
        const audio = new Audio();

        // Set up event listeners
        const onCanPlay = () => {
          console.log(`Audio URL test passed: ${url}`);
          cleanup();
          resolve(true);
        };

        const onError = (e: any) => {
          console.warn(`Audio element failed to load ${url}:`, e);
          // Return true anyway to let the user try playing it later
          // This prevents too many NFTs from being filtered out
          cleanup();
          resolve(true);
        };

        // Function to clean up listeners
        const cleanup = () => {
          audio.removeEventListener("canplaythrough", onCanPlay);
          audio.removeEventListener("error", onError);
          if (timeout) clearTimeout(timeout);
        };

        // Set timeout to prevent long hanging
        const timeout = setTimeout(() => {
          console.warn(
            `Audio load timeout for ${url}, assuming it's valid anyway`
          );
          cleanup();
          resolve(true);
        }, 5000);

        // Add listeners
        audio.addEventListener("canplaythrough", onCanPlay);
        audio.addEventListener("error", onError);

        // Start loading
        audio.src = url;
        audio.load();
      });
    } catch (error) {
      console.error(`Error testing audio URL ${url}:`, error);
      // Return true anyway to let the user try playing it
      return true;
    }
  };

  // Function to refresh NFT tracks - can be called manually if needed
  const refreshNftTracks = async () => {
    if (!connected || !publicKey) {
      console.log("Wallet not connected, skipping NFT refresh");
      return;
    }

    try {
      setIsLoadingNfts(true);
      console.log(
        "Fetching NFT music tracks from wallet...",
        publicKey.toString()
      );

      // Reset failed tracks tracking
      failedTracksRef.current.clear();

      // Use the NFT audio service to get audio NFTs
      const audioNFTs = await fetchNFTAudioTracks(publicKey);

      console.log(`Found ${audioNFTs.length} NFTs with audio content`);

      // First, remove any existing NFT tracks
      const updatedTracks = { ...audioTracks };
      Object.keys(updatedTracks).forEach((trackId) => {
        if (trackId.startsWith("nft-")) {
          delete updatedTracks[trackId];
        }
      });

      // Then process and add NFT tracks
      if (audioNFTs.length > 0) {
        // Process NFTs in batches to avoid overwhelming the browser
        const batchSize = 3;
        for (let i = 0; i < audioNFTs.length; i += batchSize) {
          const batch = audioNFTs.slice(i, i + batchSize);

          // Process each NFT in the batch
          await Promise.all(
            batch.map(async (nft: any) => {
              try {
                if (!nft.extractedAudioUrl) {
                  console.warn(`NFT ${nft.name} has no audio URL, skipping`);
                  return;
                }

                // Create a unique ID for this NFT track
                const trackId = `nft-${nft.id}`;

                // Test if the audio URL is valid
                const isValid = await testAudioUrl(nft.extractedAudioUrl);

                if (!isValid) {
                  console.warn(
                    `Audio URL for NFT ${nft.name} is not valid or cannot be played, skipping`
                  );
                  failedTracksRef.current.add(trackId);
                  return;
                }

                // Create track object using the extracted data
                updatedTracks[trackId] = {
                  path: nft.extractedAudioUrl,
                  title: nft.name,
                  artist: nft.artist || "VOID",
                  duration: nft.duration || 180,
                  cover: nft.image,
                  isNft: true,
                  nftData: nft,
                };

                console.log(
                  `Added NFT track: ${trackId} - ${nft.name} - ${nft.extractedAudioUrl}`
                );
              } catch (nftError) {
                console.error(`Error adding NFT track:`, nftError);
              }
            })
          );

          // Update state after each batch to show progress
          setAudioTracks({ ...updatedTracks });

          // Small delay to avoid browser jank
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Final update to ensure we have the complete set
      setAudioTracks(updatedTracks);

      // Log failed tracks if any
      if (failedTracksRef.current.size > 0) {
        console.warn(
          `${failedTracksRef.current.size} NFT tracks failed to load`
        );
      }
    } catch (error) {
      console.error("Error fetching NFT music tracks:", error);
    } finally {
      setIsLoadingNfts(false);
    }
  };

  // Initialize audio on mount
  useEffect(() => {
    console.log("AudioProvider - Initializing audio...");

    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.volume = volume;
      audioRef.current = audio;

      // Try to load saved track from localStorage
      const savedTrack = localStorage.getItem("currentRealmAudio");
      const initialTrack = savedTrack || "hub";

      console.log(`AudioProvider - Initial track: ${initialTrack}`);
      setCurrentTrackId(initialTrack);

      // Get the track info
      const trackInfo = audioTracks[initialTrack];

      if (trackInfo) {
        audio.src = trackInfo.path;
        // Load the audio without starting playback
        audio.load();

        // Don't auto-play! Wait for user interaction instead
        // The user will need to click play first
        console.log(
          "AudioProvider - Audio loaded, waiting for user interaction"
        );
      }

      // Setup event handlers for the audio element
      audio.addEventListener("play", () => {
        console.log("Audio element 'play' event triggered");
        setIsPlaying(true);
      });

      audio.addEventListener("pause", () => {
        console.log("Audio element 'pause' event triggered");
        setIsPlaying(false);
      });

      audio.addEventListener("ended", () => {
        console.log("Audio element 'ended' event triggered");
        setIsPlaying(false);
      });

      // Setup error handler for the audio element
      audio.addEventListener("error", (e) => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);

        // If current track fails, try switching to a default track
        if (currentTrackId.startsWith("nft-")) {
          console.log("NFT track failed to play, switching to default track");
          changeTrack("hub");
        }
      });

      // Set up progress tracking
      progressIntervalRef.current = window.setInterval(() => {
        if (audioRef.current && audioRef.current.duration) {
          setProgress(audioRef.current.currentTime / audioRef.current.duration);
        }
      }, 1000);

      setIsInitialized(true);
    }

    // Cleanup function
    return () => {
      console.log("AudioProvider - Cleaning up audio resources");

      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }

      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current);
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Clear any active fade interval
  const clearFadeInterval = () => {
    if (fadeIntervalRef.current !== null) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    isFadingRef.current = false;
  };

  // Fade in audio
  const fadeIn = () => {
    if (!audioRef.current) return;
    clearFadeInterval();

    isFadingRef.current = true;

    let vol = 0;
    audioRef.current.volume = vol;

    fadeIntervalRef.current = window.setInterval(() => {
      if (!audioRef.current) {
        clearFadeInterval();
        return;
      }

      vol = Math.min(vol + 0.05, volume);
      audioRef.current.volume = vol;

      if (vol >= volume) {
        clearFadeInterval();
      }
    }, 50);
  };

  // Fade out audio
  const fadeOut = (callback?: () => void) => {
    if (!audioRef.current) {
      if (callback) callback();
      return;
    }

    clearFadeInterval();
    isFadingRef.current = true;

    let vol = audioRef.current.volume;

    if (vol <= 0) {
      if (callback) callback();
      return;
    }

    fadeIntervalRef.current = window.setInterval(() => {
      if (!audioRef.current) {
        clearFadeInterval();
        if (callback) callback();
        return;
      }

      vol = Math.max(vol - 0.05, 0);
      audioRef.current.volume = vol;

      if (vol <= 0) {
        clearFadeInterval();
        if (callback) callback();
      }
    }, 50);
  };

  // Toggle playback - FIXED to ensure UI state matches audio state
  const togglePlayback = () => {
    console.log("AudioProvider - Toggling playback, current state:", isPlaying);

    if (!audioRef.current) return;

    // Prevent multiple toggle calls during fade operations
    if (isFadingRef.current) {
      console.log(
        "AudioProvider - Fade operation in progress, ignoring toggle request"
      );
      return;
    }

    if (isPlaying) {
      // IMPORTANT: Always pause the audio immediately to ensure synchronization
      audioRef.current.pause();
      fadeOut(() => {
        setIsPlaying(false); // This should be redundant due to the event listener, but keeping as backup
      });
    } else {
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            fadeIn();
            setIsPlaying(true); // This should be redundant due to the event listener, but keeping as backup
          })
          .catch((error) => {
            console.error("AudioProvider - Failed to play audio:", error);
            setIsPlaying(false);
          });
      }
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return;

    if (volume > 0) {
      previousVolumeRef.current = volume;
      setCurrentVolume(0);
      audioRef.current.volume = 0;
    } else {
      setCurrentVolume(previousVolumeRef.current);
      audioRef.current.volume = previousVolumeRef.current;
    }
  };

  // Play a specific sound - different from changeTrack as it doesn't update currentTrackId
  const playSound = (trackId: string) => {
    // If we're not playing the main track, don't play additional sounds
    // This helps prevent audio confusion
    if (!isPlaying) {
      console.log(
        "AudioProvider - Not playing sound effect because main track is paused"
      );
      return;
    }

    const track = audioTracks[trackId];
    if (!track) {
      console.error(`AudioProvider - Unknown track ID: ${trackId}`);
      return;
    }

    // Create a temporary audio element for this sound
    const soundEffect = new Audio(track.path);
    soundEffect.volume = volume * 0.5; // Play sound effects at lower volume

    soundEffect.play().catch((error) => {
      console.error(`AudioProvider - Failed to play sound: ${trackId}`, error);
    });
  };

  // Change track with fade effect and error handling - FIXED to ensure proper state synchronization
  const changeTrack = (trackId: string) => {
    console.log(`AudioProvider - Changing track to: ${trackId}`);

    if (!audioTracks[trackId]) {
      console.error(`AudioProvider - Invalid track ID: ${trackId}`);
      return;
    }

    // Don't switch to a track that previously failed
    if (failedTracksRef.current.has(trackId)) {
      console.warn(`Skipping track ${trackId} that previously failed to load`);
      return;
    }

    // Save to localStorage for persistence (only for realm tracks, not NFT tracks)
    if (!trackId.startsWith("nft-")) {
      localStorage.setItem("currentRealmAudio", trackId);
    }

    // If audio isn't initialized yet, just update the state
    if (!audioRef.current) {
      setCurrentTrackId(trackId);
      return;
    }

    const trackInfo = audioTracks[trackId];

    // If we're already playing this track, don't do anything
    if (currentTrackId === trackId) {
      console.log(`AudioProvider - Already playing track: ${trackId}`);
      return;
    }

    // Prevent track changes during fade operations
    if (isFadingRef.current) {
      console.log(
        "AudioProvider - Fade operation in progress, waiting before changing track"
      );
      clearFadeInterval(); // Clear existing fade to proceed with track change
    }

    // IMPORTANT: First pause the current audio to ensure only one track plays
    const wasPlaying = isPlaying;
    audioRef.current.pause();

    // If currently playing, fade out before changing
    if (wasPlaying && audioRef.current.volume > 0) {
      fadeOut(() => {
        if (!audioRef.current) return;

        audioRef.current.src = trackInfo.path;
        audioRef.current.currentTime = 0;
        setCurrentTrackId(trackId);

        if (wasPlaying) {
          const playPromise = audioRef.current.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                fadeIn();
                setIsPlaying(true);
              })
              .catch((error) => {
                console.error(
                  "AudioProvider - Failed to play new track:",
                  error
                );
                setIsPlaying(false);

                // Mark this track as failed
                failedTracksRef.current.add(trackId);

                // Try to switch to a default track
                if (trackId.startsWith("nft-")) {
                  console.log(
                    "NFT track failed to play, switching to default track"
                  );
                  // Use setTimeout to avoid recursive call issues
                  setTimeout(() => changeTrack("hub"), 0);
                }
              });
          }
        }
      });
    } else {
      // If not playing or already faded out, just change the track
      audioRef.current.src = trackInfo.path;
      audioRef.current.currentTime = 0;
      setCurrentTrackId(trackId);

      if (wasPlaying) {
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              fadeIn();
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("AudioProvider - Failed to play new track:", error);
              setIsPlaying(false);

              // Mark this track as failed
              failedTracksRef.current.add(trackId);

              // Try to switch to a default track
              if (trackId.startsWith("nft-")) {
                console.log(
                  "NFT track failed to play, switching to default track"
                );
                // Use setTimeout to avoid recursive call issues
                setTimeout(() => changeTrack("hub"), 0);
              }
            });
        }
      } else {
        // If we weren't playing, load the track but don't start playback
        audioRef.current.load();
        setIsPlaying(false);
      }
    }
  };

  const skipToPrevious = () => {
    console.log("AudioProvider - Skipping to previous track");
    // Get all track IDs
    const trackIds = Object.keys(audioTracks);

    // Find the index of the current track
    const currentIndex = trackIds.indexOf(currentTrackId);

    // Calculate the previous index (with wraparound)
    const prevIndex = (currentIndex - 1 + trackIds.length) % trackIds.length;

    // Change to the previous track
    changeTrack(trackIds[prevIndex]);
  };

  // Skip to next track
  const skipToNext = () => {
    console.log("AudioProvider - Skipping to next track");
    // Get all track IDs
    const trackIds = Object.keys(audioTracks);

    // Find the index of the current track
    const currentIndex = trackIds.indexOf(currentTrackId);

    // Calculate the next index (with wraparound)
    const nextIndex = (currentIndex + 1) % trackIds.length;

    // Change to the next track
    changeTrack(trackIds[nextIndex]);
  };

  // Set volume
  const setVolume = (newVolume: number) => {
    console.log(`AudioProvider - Setting volume to: ${newVolume}`);

    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setCurrentVolume(clampedVolume);

    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }

    if (clampedVolume > 0) {
      previousVolumeRef.current = clampedVolume;
    }
  };

  // Seek to a position
  const seekTo = (value: number) => {
    if (!audioRef.current) return;

    const clampedValue = Math.max(0, Math.min(1, value));

    if (audioRef.current.duration) {
      audioRef.current.currentTime = clampedValue * audioRef.current.duration;
      setProgress(clampedValue);
    }
  };

  // Update volume when the volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Ensure that the isPlaying state always matches the audio element's state
  useEffect(() => {
    const checkPlayState = () => {
      if (audioRef.current) {
        // Check if the real audio element state matches our isPlaying state
        const audioIsPlaying = !audioRef.current.paused;
        if (audioIsPlaying !== isPlaying && !isFadingRef.current) {
          console.log(
            `AudioProvider - Fixing state mismatch: isPlaying=${isPlaying}, audio.paused=${audioRef.current.paused}`
          );
          setIsPlaying(audioIsPlaying);
        }
      }
    };

    // Set up an interval to periodically check for state synchronization
    const syncInterval = setInterval(checkPlayState, 1000);

    return () => {
      clearInterval(syncInterval);
    };
  }, [isPlaying]);

  // Context value that will be provided
  const contextValue: AudioContextType = {
    isPlaying,
    currentTrackId,
    volume,
    progress,
    togglePlayback,
    toggleMute,
    changeTrack,
    skipToPrevious,
    skipToNext,
    setVolume,
    seekTo,
    playSound,
    addTrack,
    removeTrack,
    getAvailableTracks,
    getCurrentTrack,
    audioTracks,
    isNftTrack,
    isLoadingNfts,
    refreshNftTracks,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

// Custom hook for using the audio context
export const useAudio = () => {
  const context = useContext(AudioContext);

  if (context === null) {
    throw new Error("useAudio must be used within an AudioProvider");
  }

  return context;
};

// Audio Controller UI Component with NFT track support
interface AudioControllerProps {
  isPlaying: boolean;
  currentTrackId: string;
  volume: number;
  progress: number;
  onTogglePlayback: () => void;
  onToggleMute: () => void;
  onTrackChange: (trackId: string) => void;
  onSkipPrevious: () => void;
  onSkipNext: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (progress: number) => void;
}

export const AudioController: React.FC<AudioControllerProps> = ({
  isPlaying,
  currentTrackId,
  volume,
  progress,
  onTogglePlayback,
  onSkipPrevious,
  onSkipNext,
  onToggleMute,
  onTrackChange,
  onVolumeChange,
  onSeek,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNftTracks, setShowNftTracks] = useState(false);
  const audio = useAudio();
  const { connected } = useWallet();

  // Get current track info
  const currentTrack =
    audio.audioTracks[currentTrackId] || audio.audioTracks.hub;

  // Calculate current time
  const currentTime = progress * (currentTrack.duration || 0);

  // Group tracks by type (default vs NFT)
  const defaultTracks = Object.entries(audio.audioTracks).filter(
    ([id]) => !id.startsWith("nft-")
  );
  const nftTracks = Object.entries(audio.audioTracks).filter(([id]) =>
    id.startsWith("nft-")
  );

  // Check if this is an NFT track
  const isNftTrack = audio.isNftTrack(currentTrackId);

  // Refresh NFT tracks from wallet
  const handleRefreshNftTracks = () => {
    audio.refreshNftTracks();
  };

  return (
    <>
      {/* Minimized Player */}
      <motion.div
        className={`fixed top-4 left-4 z-50 flex items-center bg-black/40 backdrop-blur-md rounded-full border border-purple-500/30 p-1 pr-3 ${
          isExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.03 }}
      >
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mr-2"
          onClick={onTogglePlayback}
        >
          {isPlaying ? (
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
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
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
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>
        <div className="flex flex-col">
          <span className="text-white text-xs font-medium truncate max-w-[100px]">
            {currentTrack.title}
          </span>
          <span className="text-gray-400 text-xs truncate max-w-[100px]">
            {currentTrack.artist}
            {isNftTrack && <span className="ml-1 text-pink-400">NFT</span>}
          </span>
        </div>
        <button
          className="ml-2 text-gray-400 hover:text-white"
          onClick={() => setIsExpanded(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
      </motion.div>

      {/* Expanded Audio Player */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed top-4 left-4 z-50 bg-black/60 backdrop-blur-md rounded-xl border border-purple-500/30 shadow-lg shadow-purple-500/10 w-64 overflow-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Header with close button */}
            <div className="flex justify-between items-center p-3 border-b border-purple-500/20">
              <h3 className="font-bold text-white">Music Player</h3>
              <div className="flex gap-2">
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => setIsExpanded(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
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
            </div>

            {/* Cover Art and Track Info */}
            <div className="p-4">
              <div className="aspect-square w-full mb-4 bg-purple-900/20 rounded-lg overflow-hidden relative">
                <img
                  src={currentTrack.cover}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.src = "/default-cover.jpg";
                  }}
                />
                {/* NFT badge */}
                {isNftTrack && (
                  <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded">
                    NFT
                  </div>
                )}
                {/* Pulsing animation for playing state */}
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M8 3v18c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1H9c-.6 0-1 .4-1 1Z"></path>
                        <path d="M8 10H3.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5H8Z"></path>
                        <path d="M16 10h4.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5H16Z"></path>
                      </svg>
                    </motion.div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="text-white font-bold text-lg truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-gray-400 text-sm truncate">
                  {currentTrack.artist}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="relative h-1 bg-gray-700 rounded-full mb-1">
                  <motion.div
                    className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${progress * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={progress}
                    onChange={(e) => onSeek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(currentTrack.duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex justify-between items-center mb-4">
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => audio.skipToPrevious()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="19 20 9 12 19 4 19 20"></polygon>
                    <line x1="5" y1="19" x2="5" y2="5"></line>
                  </svg>
                </button>

                <button
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                  onClick={onTogglePlayback}
                >
                  {isPlaying ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                </button>

                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => audio.skipToNext()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 4 15 12 5 20 5 4"></polygon>
                    <line x1="19" y1="5" x2="19" y2="19"></line>
                  </svg>
                </button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={onToggleMute}
                >
                  {volume === 0 ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <line x1="23" y1="9" x2="17" y2="15"></line>
                      <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    </svg>
                  )}
                </button>
                <div className="relative flex-1 h-1 bg-gray-700 rounded-full">
                  <motion.div
                    className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${volume * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Music Library & Settings */}
            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  className="border-t border-purple-500/20 p-4"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {/* Tab buttons to switch between default and NFT tracks */}
                  <div className="flex mb-3 border-b border-purple-800/30">
                    <button
                      className={`flex-1 py-2 text-sm ${
                        !showNftTracks
                          ? "text-purple-400 border-b-2 border-purple-500"
                          : "text-gray-400"
                      }`}
                      onClick={() => setShowNftTracks(false)}
                    >
                      Game Tracks
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm ${
                        showNftTracks
                          ? "text-pink-400 border-b-2 border-pink-500"
                          : "text-gray-400"
                      }`}
                      onClick={() => setShowNftTracks(true)}
                    >
                      NFT Tracks{" "}
                      {nftTracks.length > 0 && `(${nftTracks.length})`}
                    </button>
                  </div>

                  {/* Content based on selected tab */}
                  <AnimatePresence mode="wait">
                    {!showNftTracks ? (
                      // Default Game Tracks
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key="game-tracks"
                      >
                        <h3 className="text-white font-bold mb-2 text-sm">
                          Game Tracks
                        </h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {defaultTracks.map(([id, track]) => (
                            <button
                              key={id}
                              className={`flex items-center w-full p-2 rounded ${
                                currentTrackId === id
                                  ? "bg-purple-900/30 border border-purple-500/40"
                                  : "hover:bg-purple-900/20"
                              }`}
                              onClick={() => onTrackChange(id)}
                            >
                              <div className="w-8 h-8 bg-black rounded overflow-hidden mr-2 flex-shrink-0">
                                <img
                                  src={track.cover}
                                  alt={track.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "/default-cover.jpg";
                                  }}
                                />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="text-sm text-white truncate">
                                  {track.title}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                  {track.artist}
                                </div>
                              </div>
                              {currentTrackId === id && (
                                <div className="w-2 h-2 rounded-full bg-pink-500 ml-2 flex-shrink-0"></div>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      // NFT Tracks
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key="nft-tracks"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-white font-bold text-sm">
                            Your NFT Tracks
                          </h3>

                          {/* Refresh button */}
                          <button
                            onClick={handleRefreshNftTracks}
                            disabled={audio.isLoadingNfts}
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center"
                          >
                            {audio.isLoadingNfts ? (
                              <svg
                                className="animate-spin h-3 w-3 mr-1"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-1"
                              >
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"></path>
                              </svg>
                            )}
                            {audio.isLoadingNfts ? "Loading..." : "Refresh"}
                          </button>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {nftTracks.length > 0 ? (
                            nftTracks.map(([id, track]) => (
                              <button
                                key={id}
                                className={`flex items-center w-full p-2 rounded ${
                                  currentTrackId === id
                                    ? "bg-purple-900/30 border border-purple-500/40"
                                    : "hover:bg-purple-900/20"
                                }`}
                                onClick={() => onTrackChange(id)}
                              >
                                <div className="w-8 h-8 bg-black rounded overflow-hidden mr-2 flex-shrink-0">
                                  <img
                                    src={track.cover}
                                    alt={track.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "/default-cover.jpg";
                                    }}
                                  />
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="text-sm text-white truncate">
                                    {track.title}
                                  </div>
                                  <div className="text-xs text-gray-400 truncate">
                                    {track.artist}
                                  </div>
                                </div>
                                {currentTrackId === id && (
                                  <div className="w-2 h-2 rounded-full bg-pink-500 ml-2 flex-shrink-0"></div>
                                )}
                              </button>
                            ))
                          ) : connected ? (
                            <div className="text-sm text-gray-500 py-4 text-center">
                              No NFT tracks found.
                              <br />
                              {audio.isLoadingNfts
                                ? "Loading..."
                                : "Click Refresh to scan your wallet again."}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 py-4 text-center">
                              Connect your wallet to see your music NFTs.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Refresh button at the bottom of NFT Tracks tab */}
                  {showNftTracks && (
                    <button
                      onClick={handleRefreshNftTracks}
                      disabled={audio.isLoadingNfts || !connected}
                      className={`mt-3 w-full py-2 text-sm border ${
                        connected
                          ? "border-pink-500/50 text-pink-400 hover:bg-pink-900/20"
                          : "border-gray-700/50 text-gray-500"
                      }`}
                    >
                      {audio.isLoadingNfts ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Loading Music NFTs...
                        </span>
                      ) : connected ? (
                        "Refresh Music NFTs"
                      ) : (
                        "Connect Wallet to Import Music NFTs"
                      )}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AudioController;