import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Define audio tracks with more metadata
export const audioTracks = {
  hub: {
    path: "/audio/hub-theme.mp3",
    title: "Void Hub",
    artist: "Synth Wave",
    duration: 220, // Duration in seconds
    cover: "/images/hub-cover.jpg" // Cover art path
  },
  echo: {
    path: "/audio/echo-theme.mp3",
    title: "Echo Chamber",
    artist: "Memory Lane",
    duration: 180,
    cover: "/images/echo-cover.jpg"
  },
  nexus: {
    path: "/audio/nexus-theme.mp3",
    title: "Neural Network",
    artist: "Connected",
    duration: 195,
    cover: "/images/nexus-cover.jpg"
  },
  abyss: {
    path: "/audio/abyss-theme.mp3",
    title: "Deep Void",
    artist: "Dark Matter",
    duration: 210,
    cover: "/images/abyss-cover.jpg"
  },
  pulse: {
    path: "/audio/pulse-theme.mp3",
    title: "Digital Heartbeat",
    artist: "Rhythm Sync",
    duration: 185,
    cover: "/images/pulse-cover.jpg"
  },
  cipher: {
    path: "/audio/cipher-theme.mp3",
    title: "Encrypted",
    artist: "Code Breaker",
    duration: 190,
    cover: "/images/cipher-cover.jpg"
  }
};

interface UseAudioControllerProps {
  enabled?: boolean;
  initialTrackId?: string;
  volume?: number;
}

interface AudioControllerResult {
  isPlaying: boolean;
  currentTrackId: string;
  volume: number;
  progress: number;
  togglePlayback: () => void;
  toggleMute: () => void;
  changeTrack: (trackId: string) => void;
  setVolume: (volume: number) => void;
  seekTo: (progress: number) => void;
}

/**
 * Enhanced hook for audio control with more features
 */
export const useAudioController = ({
  enabled = true,
  initialTrackId = "hub",
  volume = 0.7
}: UseAudioControllerProps = {}): AudioControllerResult => {
  const [isPlaying, setIsPlaying] = useState(enabled);
  const [currentTrackId, setCurrentTrackId] = useState(initialTrackId);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [progress, setProgress] = useState(0);
  
  // Previous state for mute toggle
  const previousVolumeRef = useRef(volume);
  
  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Progress interval ref
  const progressIntervalRef = useRef<number | null>(null);
  
  // Fade transition refs
  const fadeIntervalRef = useRef<number | null>(null);
  
  // Initialize audio
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.volume = currentVolume;
      audioRef.current = audio;
      
      // Get the track info
      const trackInfo = audioTracks[currentTrackId as keyof typeof audioTracks];
      
      if (trackInfo) {
        audio.src = trackInfo.path;
        if (isPlaying) {
          audio.play().catch(error => {
            console.error("Failed to play audio:", error);
            setIsPlaying(false);
          });
        }
      }
    }
    
    // Set up progress tracking
    progressIntervalRef.current = window.setInterval(() => {
      if (audioRef.current && audioRef.current.duration) {
        setProgress(audioRef.current.currentTime / audioRef.current.duration);
      }
    }, 1000);
    
    return () => {
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
  
  // Handle track changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    const trackInfo = audioTracks[currentTrackId as keyof typeof audioTracks];
    if (!trackInfo) return;
    
    // If currently playing, fade out before changing
    if (isPlaying && audioRef.current.volume > 0) {
      fadeOut(() => {
        audioRef.current!.src = trackInfo.path;
        audioRef.current!.currentTime = 0;
        if (isPlaying) {
          audioRef.current!.play().then(() => {
            fadeIn();
          }).catch(error => {
            console.error("Failed to play new track:", error);
          });
        }
      });
    } else {
      // If not playing or already faded out, just change the track
      audioRef.current.src = trackInfo.path;
      audioRef.current.currentTime = 0;
      if (isPlaying) {
        audioRef.current.play().then(() => {
          fadeIn();
        }).catch(error => {
          console.error("Failed to play new track:", error);
        });
      }
    }
  }, [currentTrackId]);
  
  // Handle play/pause changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().then(() => {
        fadeIn();
      }).catch(error => {
        console.error("Failed to play audio:", error);
        setIsPlaying(false);
      });
    } else {
      fadeOut(() => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      });
    }
  }, [isPlaying]);
  
  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = currentVolume;
    }
  }, [currentVolume]);
  
  // Clear any active fade interval
  const clearFadeInterval = () => {
    if (fadeIntervalRef.current !== null) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };
  
  // Fade in audio
  const fadeIn = () => {
    if (!audioRef.current) return;
    clearFadeInterval();
    
    let vol = 0;
    audioRef.current.volume = vol;
    
    fadeIntervalRef.current = window.setInterval(() => {
      if (!audioRef.current) {
        clearFadeInterval();
        return;
      }
      
      vol = Math.min(vol + 0.05, currentVolume);
      audioRef.current.volume = vol;
      
      if (vol >= currentVolume) {
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
  
  // Toggle playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (currentVolume > 0) {
      previousVolumeRef.current = currentVolume;
      setCurrentVolume(0);
    } else {
      setCurrentVolume(previousVolumeRef.current);
    }
  };
  
  // Change track
  const changeTrack = (trackId: string) => {
    if (audioTracks[trackId as keyof typeof audioTracks]) {
      setCurrentTrackId(trackId);
    }
  };
  
  // Set volume
  const setVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setCurrentVolume(clampedVolume);
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
  
  return {
    isPlaying,
    currentTrackId,
    volume: currentVolume,
    progress,
    togglePlayback,
    toggleMute,
    changeTrack,
    setVolume,
    seekTo
  };
};

// Format time in MM:SS
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface AudioControllerProps {
  isPlaying: boolean;
  currentTrackId: string;
  volume: number;
  progress: number;
  onTogglePlayback: () => void;
  onToggleMute: () => void;
  onTrackChange: (trackId: string) => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (progress: number) => void;
}

// Modern Audio Controller UI Component
export const AudioController: React.FC<AudioControllerProps> = ({
  isPlaying,
  currentTrackId,
  volume,
  progress,
  onTogglePlayback,
  onToggleMute,
  onTrackChange,
  onVolumeChange,
  onSeek
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Get current track info
  const currentTrack = audioTracks[currentTrackId as keyof typeof audioTracks] || audioTracks.hub;
  
  // Calculate current time
  const currentTime = progress * (currentTrack.duration || 0);
  
  return (
    <>
      {/* Minimized Player */}
      <motion.div 
        className={`fixed top-4 left-4 z-50 flex items-center bg-black/40 backdrop-blur-md rounded-full border border-purple-500/30 p-1 pr-3 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.03 }}
      >
        <button 
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mr-2"
          onClick={onTogglePlayback}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>
        <div className="flex flex-col">
          <span className="text-white text-xs font-medium truncate max-w-[100px]">{currentTrack.title}</span>
          <span className="text-gray-400 text-xs truncate max-w-[100px]">{currentTrack.artist}</span>
        </div>
        <button 
          className="ml-2 text-gray-400 hover:text-white"
          onClick={() => setIsExpanded(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setIsExpanded(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    e.currentTarget.src = "/images/default-cover.jpg";
                  }}
                />
                {/* Pulsing animation for playing state */}
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3v18c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1H9c-.6 0-1 .4-1 1Z"></path>
                        <path d="M8 10H3.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5H8Z"></path>
                        <path d="M16 10h4.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5H16Z"></path>
                      </svg>
                    </motion.div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <h4 className="text-white font-bold text-lg truncate">{currentTrack.title}</h4>
                <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
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
                <button className="text-gray-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="19 20 9 12 19 4 19 20"></polygon>
                    <line x1="5" y1="19" x2="5" y2="5"></line>
                  </svg>
                </button>
                
                <button 
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                  onClick={onTogglePlayback}
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                </button>
                
                <button className="text-gray-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <line x1="23" y1="9" x2="17" y2="15"></line>
                      <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <h3 className="text-white font-bold mb-2">Available Tracks</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {Object.entries(audioTracks).map(([id, track]) => (
                      <button
                        key={id}
                        className={`flex items-center w-full p-2 rounded ${
                          currentTrackId === id 
                            ? 'bg-purple-900/30 border border-purple-500/40' 
                            : 'hover:bg-purple-900/20'
                        }`}
                        onClick={() => onTrackChange(id)}
                      >
                        <div className="w-8 h-8 bg-black rounded overflow-hidden mr-2 flex-shrink-0">
                          <img 
                            src={track.cover} 
                            alt={track.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/images/default-cover.jpg";
                            }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm text-white truncate">{track.title}</div>
                          <div className="text-xs text-gray-400 truncate">{track.artist}</div>
                        </div>
                        {currentTrackId === id && (
                          <div className="w-2 h-2 rounded-full bg-pink-500 ml-2 flex-shrink-0"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default useAudioController;