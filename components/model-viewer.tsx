// Updated ModelViewer component with improved IPFS handling
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ModelViewerProps {
  isOpen: boolean;
  onClose: () => void;
  modelUrl: string | null;
  nft?: any;
  fallbackUrls?: string[];
}

// List of reliable IPFS gateways to try
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
  'https://ipfs.fleek.co/ipfs/',
  'https://ipfs.infura.io/ipfs/'
];

const ModelViewer: React.FC<ModelViewerProps> = ({
  isOpen,
  onClose,
  modelUrl,
  nft,
  fallbackUrls = []
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [activeUrls, setActiveUrls] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(true);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);

  // Convert IPFS URL to HTTP URL using a gateway
  const ipfsToHttpUrl = useCallback((ipfsUri: string, gateway: string): string => {
    if (!ipfsUri) return '';
    
    // Handle ipfs:// protocol
    if (ipfsUri.startsWith('ipfs://')) {
      const hash = ipfsUri.replace('ipfs://', '');
      return `${gateway}${hash}`;
    }
    
    // Handle /ipfs/ paths
    if (ipfsUri.includes('/ipfs/')) {
      const hash = ipfsUri.split('/ipfs/')[1];
      return `${gateway}${hash}`;
    }
    
    // If it's already an HTTP URL, return as is
    if (ipfsUri.startsWith('http')) {
      return ipfsUri;
    }
    
    // Assume it's a direct hash
    return `${gateway}${ipfsUri}`;
  }, []);

  // Generate URLs from model hash/URL using different gateways
  const generateModelUrls = useCallback((modelSource: string): string[] => {
    const urls: string[] = [];
    
    // Check if it's an IPFS URI
    if (modelSource.startsWith('ipfs://')) {
      // Create URLs with different gateways
      IPFS_GATEWAYS.forEach(gateway => {
        urls.push(ipfsToHttpUrl(modelSource, gateway));
      });
    } 
    // If it's already an HTTP URL
    else if (modelSource.startsWith('http')) {
      urls.push(modelSource);
      
      // If it's an IPFS gateway URL, generate alternative gateway URLs
      if (modelSource.includes('/ipfs/')) {
        const parts = modelSource.split('/ipfs/');
        if (parts.length > 1) {
          const ipfsHash = parts[1];
          IPFS_GATEWAYS.forEach(gateway => {
            const altUrl = `${gateway}${ipfsHash}`;
            if (!urls.includes(altUrl)) {
              urls.push(altUrl);
            }
          });
        }
      }
    }
    
    // Add model viewer URLs for better compatibility
    if (!modelSource.includes('modelviewer.dev') && urls.length > 0) {
      // Use the first direct URL to create a model viewer URL
      const viewerUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(urls[0])}&ar=true&autoplay=true&autoRotate=true&cameraControls=true`;
      urls.push(viewerUrl);
    }
    
    return urls;
  }, [ipfsToHttpUrl]);

  // Set up model URLs including direct access and various viewers
  useEffect(() => {
    if (!modelUrl) return;
    
    let urls: string[] = [];
    
    // If we have model3dHash, prioritize direct IPFS gateway URLs
    if (nft?.model3dHash) {
      const ipfsHash = nft.model3dHash;
      // Prioritize Pinata gateway since it worked in your logs
      urls = [
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        `https://ipfs.filebase.io/ipfs/${ipfsHash}`,
        `https://dweb.link/ipfs/${ipfsHash}`,
        `https://ipfs.io/ipfs/${ipfsHash}`,
        `https://nftstorage.link/ipfs/${ipfsHash}`,
        `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`, // Deprioritize since it failed
        `https://w3s.link/ipfs/${ipfsHash}`
      ];
    }
    
    // If modelUrl is an IPFS URI, convert it using multiple gateways
    if (modelUrl.startsWith('ipfs://')) {
      const ipfsHash = modelUrl.replace('ipfs://', '');
      
      // Only add if we don't already have this from model3dHash
      if (!nft?.model3dHash) {
        urls = [
          `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
          `https://ipfs.filebase.io/ipfs/${ipfsHash}`,
          `https://dweb.link/ipfs/${ipfsHash}`,
          `https://ipfs.io/ipfs/${ipfsHash}`,
          `https://nftstorage.link/ipfs/${ipfsHash}`,
          `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
          `https://w3s.link/ipfs/${ipfsHash}`
        ];
      }
    } 
    // If it's already an HTTP URL, add it
    else if (modelUrl.startsWith('http')) {
      urls.push(modelUrl);
    }
    
    // Add a model viewer URL as fallback
    if (urls.length > 0 && !urls.some(url => url.includes('modelviewer.dev'))) {
      // Use first direct URL to create model viewer URL
      urls.push(`https://modelviewer.dev/viewer.html#src=${encodeURIComponent(urls[0])}&ar=true&autoplay=true&autoRotate=true&cameraControls=true`);
    }
    
    // Add any provided fallback URLs
    if (fallbackUrls.length > 0) {
      urls = [...urls, ...fallbackUrls.filter(url => !urls.includes(url))];
    }
    
    setActiveUrls(urls);
  }, [modelUrl, nft, fallbackUrls]);

  // Try to fetch a URL to check if it's accessible
  const checkUrlAccessibility = useCallback(async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      return true; // If no error, consider it accessible (even with no-cors)
    } catch (error) {
      console.error(`URL check failed for ${url}:`, error);
      return false;
    }
  }, []);

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false);
    setLoadError(false);
    console.log("Model viewer loaded successfully");
  };

  // Handle iframe error events
  const handleIframeError = () => {
    console.error("Error loading model viewer iframe at URL:", activeUrls[currentUrlIndex]);
    setLoadError(true);
    
    // Try next URL if available
    if (currentUrlIndex < activeUrls.length - 1) {
      setCurrentUrlIndex(prevIndex => prevIndex + 1);
      setIsLoading(true);
    }
  };

  // Try next model URL
  const handleTryNextUrl = () => {
    if (currentUrlIndex < activeUrls.length - 1) {
      setCurrentUrlIndex(prevIndex => prevIndex + 1);
      setIsLoading(true);
      setLoadError(false);
    }
  };

  // Try with a different IPFS gateway
  const handleTryDifferentGateway = () => {
    // Move to next gateway index
    const nextGatewayIndex = (currentGatewayIndex + 1) % IPFS_GATEWAYS.length;
    setCurrentGatewayIndex(nextGatewayIndex);
    
    // Get the current base model URL/hash
    let modelSource = modelUrl || '';
    
    // If it's an HTTP URL with IPFS path, extract the hash
    if (modelSource.includes('/ipfs/')) {
      const parts = modelSource.split('/ipfs/');
      if (parts.length > 1) {
        modelSource = `ipfs://${parts[1]}`;
      }
    }
    
    // Or use the NFT's model hash if available
    if (!modelSource.startsWith('ipfs://') && nft?.model3dHash) {
      modelSource = `ipfs://${nft.model3dHash}`;
    }
    
    // Create new URL with the next gateway
    if (modelSource.startsWith('ipfs://')) {
      const newUrl = ipfsToHttpUrl(
        modelSource, 
        IPFS_GATEWAYS[nextGatewayIndex]
      );
      
      // Set this URL as current
      const newUrlIndex = activeUrls.indexOf(newUrl);
      if (newUrlIndex >= 0) {
        setCurrentUrlIndex(newUrlIndex);
      } else {
        // If URL isn't in our list, add it
        setActiveUrls(prevUrls => [newUrl, ...prevUrls]);
        setCurrentUrlIndex(0);
      }
      
      setIsLoading(true);
      setLoadError(false);
    }
  };

  // Try direct GLB URL
  const handleTryDirectGlb = () => {
    // Find a direct model URL (not a viewer URL)
    const directUrl = activeUrls.find(url => 
      !url.includes('modelviewer.dev') && 
      (url.endsWith('.glb') || url.endsWith('.gltf'))
    );
    
    if (directUrl) {
      window.open(directUrl, '_blank');
    } else if (nft?.model3d) {
      window.open(nft.model3d, '_blank');
    } else if (nft?.model3dHash) {
      window.open(`https://ipfs.io/ipfs/${nft.model3dHash}`, '_blank');
    }
  };

  // Toggle NFT details panel
  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black border-2 border-purple-500 p-6 max-w-5xl w-full h-[80vh] relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-pink-500 transition-colors"
          title="Close 3D Model Viewer"
          aria-label="Close 3D Model Viewer"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold text-white font-pixel">
              3D MODEL VIEWER
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="h-8 bg-purple-900/50 border-purple-500/50 hover:bg-purple-900 text-purple-300 text-xs"
              onClick={toggleInfo}
            >
              {showInfo ? "Hide Info" : "Show Info"}
            </Button>
          </div>
          
          {/* URL switcher */}
          {activeUrls.length > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">
                Source {currentUrlIndex + 1}/{activeUrls.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-purple-900/50 border-purple-500/50 hover:bg-purple-900 text-purple-300 text-xs"
                onClick={handleTryNextUrl}
                disabled={currentUrlIndex >= activeUrls.length - 1}
              >
                Try Next URL
              </Button>
            </div>
          )}
        </div>

        {/* NFT info panel */}
        {showInfo && nft && (
          <div className="mb-4 border border-purple-900/50 p-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* NFT name and basic details */}
              <div className="col-span-2 md:col-span-3">
                <h4 className="text-lg font-bold text-white">{nft.name}</h4>
                <p className="text-gray-400 text-sm">{nft.collection || "VOID Collection"}</p>
              </div>
              
              {/* NFT properties */}
              {nft.texture && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Texture:</span>
                  <span className="text-purple-400">{nft.texture}</span>
                </div>
              )}
              
              {nft.animation && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Animation:</span>
                  <span className="text-purple-400">{nft.animation}</span>
                </div>
              )}
              
              {nft.color && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Color:</span>
                  <div 
                    className="w-4 h-4 inline-block" 
                    style={{backgroundColor: nft.color}}
                  ></div>
                  <span className="text-purple-400">{nft.color}</span>
                </div>
              )}
              
              {/* Display model URL info */}
              <div className="col-span-2 md:col-span-3 mt-2">
                <details>
                  <summary className="text-blue-400 text-sm cursor-pointer">View Model Details</summary>
                  <div className="mt-2 text-xs text-gray-500 bg-black/30 p-2 rounded whitespace-nowrap overflow-x-auto">
                    {nft.model3dHash && <p>IPFS Hash: {nft.model3dHash}</p>}
                    <p>Current URL: {activeUrls[currentUrlIndex]}</p>
                    <p>Current Gateway: {IPFS_GATEWAYS[currentGatewayIndex]}</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Viewer */}
        <div className={`w-full ${showInfo ? 'h-[calc(100%-180px)]' : 'h-[calc(100%-100px)]'} flex items-center justify-center bg-black/50 relative`}>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Loading 3D Model...</p>
            </div>
          )}
          
          {loadError && (
            <div className="text-center p-8">
              <p className="text-gray-400 mb-4">
                Unable to load 3D model with the current viewer.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  variant="outline"
                  className="bg-purple-900/50 border-purple-500/50 hover:bg-purple-900 text-purple-300"
                  onClick={handleTryNextUrl}
                  disabled={currentUrlIndex >= activeUrls.length - 1}
                >
                  Try Another Source
                </Button>
                <Button
                  variant="outline"
                  className="bg-blue-900/50 border-blue-500/50 hover:bg-blue-900 text-blue-300"
                  onClick={handleTryDifferentGateway}
                >
                  Try Different Gateway
                </Button>
                <Button
                  variant="outline"
                  className="bg-green-900/50 border-green-500/50 hover:bg-green-900 text-green-300"
                  onClick={handleTryDirectGlb}
                >
                  Open Model Directly
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-4 break-all">
                Current URL: {activeUrls[currentUrlIndex]}
              </p>
            </div>
          )}
          
          {!loadError && activeUrls[currentUrlIndex] && (
            <iframe
              src={activeUrls[currentUrlIndex]}
              title="3D Model Viewer"
              className={`w-full h-full border-0 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              allow="camera; microphone; fullscreen; autoplay; xr-spatial-tracking"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              loading="eager"
              referrerPolicy="no-referrer"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            ></iframe>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-between">
          <div>
            {activeUrls.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-blue-900/50 border-blue-500/50 hover:bg-blue-900 text-blue-300 text-xs"
                onClick={() => window.open(activeUrls[currentUrlIndex], '_blank')}
              >
                Open in New Window
              </Button>
            )}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            className="h-8 bg-pink-900/50 border-pink-500/50 hover:bg-pink-900 text-pink-300 text-xs"
            onClick={onClose}
          >
            Close Viewer
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ModelViewer;